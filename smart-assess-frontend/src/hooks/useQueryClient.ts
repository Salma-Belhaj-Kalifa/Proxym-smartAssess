import { queryClient as globalQueryClient } from '@/lib/queryClient';


export const useQueryClient = () => {
  return globalQueryClient;
};

export { queryClient } from '@/lib/queryClient';

export { queryOptions } from '@/lib/queryClient';

export default useQueryClient;
