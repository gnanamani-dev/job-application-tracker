import { useEffect, useReducer } from 'react'
import { appReducer, initialAppState } from './appReducer.js'
import { AppContext } from './appContextValue.js'
import { clearTokens, hasSessionToken, restoreAccessToken } from '../api/client.js'
import { authApi } from '../api/services.js'

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState)

  useEffect(() => {
    let active = true
    const restore = async () => {
      try {
        if (!hasSessionToken()) return
        await restoreAccessToken()
        const user = await authApi.currentUser()
        if (active) dispatch({ type: 'auth/ready', payload: user })
      } catch {
        clearTokens()
        if (active) dispatch({ type: 'auth/logout' })
      }
    }
    const onExpired = () => dispatch({ type: 'auth/logout' })
    window.addEventListener('auth:expired', onExpired)
    restore().finally(() => {
      if (active && !hasSessionToken()) dispatch({ type: 'auth/ready', payload: null })
    })
    return () => { active = false; window.removeEventListener('auth:expired', onExpired) }
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}
