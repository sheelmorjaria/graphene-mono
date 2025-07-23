import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCurrentUser, logoutUser as logoutUserService } from '../services/authService';

// Auth state shape
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case AUTH_ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    default:
      return state;
  }
};

// Create contexts
export const AuthStateContext = createContext();
export const AuthDispatchContext = createContext();

// Custom hook to use auth state
export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
};

// Custom hook to use auth dispatch
export const useAuthDispatch = () => {
  const context = useContext(AuthDispatchContext);
  if (!context) {
    throw new Error('useAuthDispatch must be used within an AuthProvider');
  }
  return context;
};

// Combined auth hook
export const useAuth = () => {
  const state = useAuthState();
  const dispatch = useAuthDispatch();
  
  return {
    ...state,
    dispatch
  };
};

// Auth actions
export const authActions = {
  loginSuccess: (user) => ({
    type: AUTH_ACTIONS.AUTH_SUCCESS,
    payload: user
  }),
  
  loginFailure: (error) => ({
    type: AUTH_ACTIONS.AUTH_FAILURE,
    payload: error
  }),
  
  logout: () => ({
    type: AUTH_ACTIONS.LOGOUT
  }),
  
  clearError: () => ({
    type: AUTH_ACTIONS.CLEAR_ERROR
  }),
  
  setLoading: (loading) => ({
    type: AUTH_ACTIONS.SET_LOADING,
    payload: loading
  }),
  
  authStart: () => ({
    type: AUTH_ACTIONS.AUTH_START
  })
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        dispatch(authActions.setLoading(true));
        const user = await getCurrentUser();
        
        if (user) {
          dispatch(authActions.loginSuccess(user));
        } else {
          dispatch(authActions.setLoading(false));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        dispatch(authActions.loginFailure(error.message));
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
};

// Higher-order component for protected routes
// eslint-disable-next-line no-unused-vars
export const withAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuthState();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to access this page.</p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

// Logout function that integrates with context
export const useLogout = () => {
  const dispatch = useAuthDispatch();
  
  return async () => {
    try {
      await logoutUserService();
      dispatch(authActions.logout());
    } catch (error) {
      // Even if logout fails, clear the local state
      dispatch(authActions.logout());
      console.error('Logout error:', error);
    }
  };
};

// Login function that integrates with context
export const useLogin = () => {
  const dispatch = useAuthDispatch();
  
  return (user) => {
    dispatch(authActions.loginSuccess(user));
  };
};