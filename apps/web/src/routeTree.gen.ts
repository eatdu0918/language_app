// 자동 생성 파일 (실제 프로젝트에서는 TanStack Router CLI가 생성)
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { RootLayout } from './routes/__root'
import { DashboardPage } from './routes/dashboard'
import { VocabularyPage } from './routes/vocabulary'
import { DocumentsPage } from './routes/documents'
import { ConversationPage } from './routes/conversation'
import { LoginPage } from './routes/login'
import { PlacementPage } from './routes/placement'
import { BillingPage } from './routes/billing'

const rootRoute = createRootRoute({ component: RootLayout })

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage })
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: DashboardPage })
const vocabularyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/vocabulary', component: VocabularyPage })
const documentsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/documents', component: DocumentsPage })
const conversationRoute = createRoute({ getParentRoute: () => rootRoute, path: '/conversation', component: ConversationPage })
const placementRoute = createRoute({ getParentRoute: () => rootRoute, path: '/placement', component: PlacementPage })
const billingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/billing', component: BillingPage })

export const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  vocabularyRoute,
  documentsRoute,
  conversationRoute,
  placementRoute,
  billingRoute,
])
