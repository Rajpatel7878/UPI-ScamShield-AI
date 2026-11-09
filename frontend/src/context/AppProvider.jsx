import { AppContext } from './AppContext.js'
import { useHealthCheck } from '../hooks/useHealthCheck.js'
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  APP_VERSION,
} from '../utils/constants.js'

export function AppProvider({ children }) {
  const health = useHealthCheck()

  const value = {
    appName: APP_NAME,
    tagline: APP_TAGLINE,
    description: APP_DESCRIPTION,
    version: APP_VERSION,
    health,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
