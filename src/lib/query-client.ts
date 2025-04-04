
import { QueryClient } from "@tanstack/react-query";
import { toast } from "./hooks/use-toast";

// Custom error handler for the query client
const queryErrorHandler = (error: unknown) => {
  const title = error instanceof Error ? error.message : 'An error occurred';
  toast({
    title,
    description: 'Please try again or contact support if the problem persists.',
    variant: 'destructive',
  });
  console.error('Query error:', error);
};

// Configure QueryClient with better error handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      meta: {
        errorHandler: queryErrorHandler, 
      }
    },
    mutations: {
      meta: {
        errorHandler: queryErrorHandler,
      }
    },
  },
});
