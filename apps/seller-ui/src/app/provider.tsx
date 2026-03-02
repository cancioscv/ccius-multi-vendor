"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import useSeller from "@/hooks/useSeller";
// import { WebSocketProvider } from "@/context/web-socket-context";

export default function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
          },
        },
      })
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// const ProvidersWithWebSocket = ({ children }: { children: React.ReactNode }) => {
//   const { seller, isLoading } = useSeller();

//   if (isLoading) return null;

//   return (
//     <>
//       {seller && <WebSocketProvider seller={seller}>{children}</WebSocketProvider>}
//       {!seller && children}
//     </>
//   );
// };

// "use client";

// import { useState } from "react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import useSeller from "@/hooks/useSeller";
// import { WebSocketProvider } from "@/context/web-socket-context";

// export default function Provider({ children }: { children: React.ReactNode }) {
//   const [queryClient] = useState(
//     () =>
//       new QueryClient({
//         defaultOptions: {
//           queries: {
//             refetchOnWindowFocus: false,
//             staleTime: 1000 * 60 * 5,
//           },
//         },
//       })
//   );
//   return (
//     <QueryClientProvider client={queryClient}>
//       <ProvidersWithWebSocket>{children}</ProvidersWithWebSocket>
//     </QueryClientProvider>
//   );
// }

// const ProvidersWithWebSocket = ({ children }: { children: React.ReactNode }) => {
//   const { seller, isLoading } = useSeller();

//   if (isLoading) return null;

//   return (
//     <>
//       {seller && <WebSocketProvider seller={seller}>{children}</WebSocketProvider>}
//       {!seller && children}
//     </>
//   );
// };
