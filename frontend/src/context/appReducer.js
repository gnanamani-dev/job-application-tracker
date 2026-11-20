export const initialAppState = {
  applications: [],
  auth: { user: null, status: 'loading' },
}

export function appReducer(state, action) {
  switch (action.type) {
    case 'applications/set':
      return { ...state, applications: action.payload }
    case 'applications/clear':
      return { ...state, applications: [] }
    case 'auth/ready':
      return { ...state, auth: { user: action.payload, status: action.payload ? 'authenticated' : 'unauthenticated' } }
    case 'auth/logout':
      return { ...state, auth: { user: null, status: 'unauthenticated' }, applications: [] }
    default:
      return state
  }
}
