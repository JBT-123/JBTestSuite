import { Outlet, createRootRoute } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanstackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRoute({
  context: (): RouterContext => ({
    queryClient: new QueryClient(),
  }),
  component: () => (
    <>
      <Header />
      <Outlet />
      <TanstackDevtools
        config={{
          position: 'bottom-left',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  ),
})
