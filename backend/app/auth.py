"""
Authentication and authorization utilities.

This module provides JWT token validation and authentication middleware
for the harvest log application.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from app.config import settings
from app.exceptions import AuthenticationError, AuthorizationError
from app.logging_config import get_api_logger

logger = get_api_logger()

# Security scheme for JWT tokens
security = HTTPBearer(auto_error=False)


class AuthManager:
    """JWT authentication manager."""
    
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=24)
        
        to_encode.update({"exp": expire})
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("Token has expired")
        except jwt.JWTError:
            raise AuthenticationError("Invalid token")


# Global auth manager (would be configured with proper secret in production)
auth_manager = AuthManager(secret_key=settings.secret_key or "dev-secret-key")


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Get current user from JWT token.
    
    Args:
        request: FastAPI request object
        credentials: HTTP authorization credentials
    
    Returns:
        User data if authenticated, None otherwise
    
    Raises:
        AuthenticationError: If token is invalid
    """
    if not credentials:
        return None
    
    try:
        payload = auth_manager.verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if not user_id:
            raise AuthenticationError("Invalid token payload")
        
        logger.debug(f"Authenticated user: {user_id}", 
                    extra={"user_id": user_id, "request_id": getattr(request.state, 'request_id', 'unknown')})
        
        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "roles": payload.get("roles", []),
            "exp": payload.get("exp")
        }
        
    except AuthenticationError:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}", exc_info=True)
        raise AuthenticationError("Authentication failed")


async def require_auth(
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Require authentication for endpoint.
    
    Args:
        current_user: Current user from token
    
    Returns:
        User data
    
    Raises:
        AuthenticationError: If not authenticated
    """
    if not current_user:
        raise AuthenticationError("Authentication required")
    
    return current_user


async def require_role(
    required_role: str,
    current_user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Require specific role for endpoint.
    
    Args:
        required_role: Required role name
        current_user: Current authenticated user
    
    Returns:
        User data
    
    Raises:
        AuthorizationError: If user doesn't have required role
    """
    user_roles = current_user.get("roles", [])
    
    if required_role not in user_roles:
        logger.warning(
            f"Access denied: user {current_user.get('user_id')} lacks role {required_role}",
            extra={
                "user_id": current_user.get("user_id"),
                "required_role": required_role,
                "user_roles": user_roles
            }
        )
        raise AuthorizationError(f"Role '{required_role}' required")
    
    return current_user


# Convenience functions for common role checks
async def require_admin(current_user: Dict[str, Any] = Depends(require_auth)) -> Dict[str, Any]:
    """Require admin role."""
    return await require_role("admin", current_user)


async def require_user(current_user: Dict[str, Any] = Depends(require_auth)) -> Dict[str, Any]:
    """Require user role (basic authenticated user)."""
    return await require_role("user", current_user)


class AuthMiddleware:
    """Authentication middleware for FastAPI."""
    
    def __init__(self, require_auth_paths: Optional[list] = None):
        """
        Initialize auth middleware.
        
        Args:
            require_auth_paths: List of path patterns that require authentication
        """
        self.require_auth_paths = require_auth_paths or ["/api/"]
    
    async def __call__(self, request: Request, call_next):
        """Process request with authentication check."""
        path = request.url.path
        
        # Skip auth for health checks and public endpoints
        if path in ["/", "/health", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Check if path requires authentication
        requires_auth = any(path.startswith(auth_path) for auth_path in self.require_auth_paths)
        
        if requires_auth:
            # Extract token from Authorization header
            auth_header = request.headers.get("authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                raise AuthenticationError("Missing or invalid authorization header")
            
            token = auth_header.split(" ")[1]
            
            try:
                # Verify token and add user to request state
                payload = auth_manager.verify_token(token)
                request.state.user = {
                    "user_id": payload.get("sub"),
                    "email": payload.get("email"),
                    "roles": payload.get("roles", [])
                }
                
                logger.debug(f"Request authenticated for user: {payload.get('sub')}")
                
            except AuthenticationError:
                raise
            except Exception as e:
                logger.error(f"Auth middleware error: {e}", exc_info=True)
                raise AuthenticationError("Authentication failed")
        
        return await call_next(request)


# Token creation helper for testing/development
def create_test_token(user_id: str, email: str, roles: list = None) -> str:
    """Create test token for development."""
    if roles is None:
        roles = ["user"]
    
    data = {
        "sub": user_id,
        "email": email,
        "roles": roles
    }
    
    return auth_manager.create_access_token(data, expires_delta=timedelta(hours=24))