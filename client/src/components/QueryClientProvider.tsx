import { QueryClient, QueryClientProvider } from 'react-query';
import React from 'react';
import { QueryProviderWrapperProps } from '../types/props';

const queryClient = new QueryClient();

const QueryProviderWrapper: React.FC<QueryProviderWrapperProps> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

export default QueryProviderWrapper;
