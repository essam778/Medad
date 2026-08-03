import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminService } from "@/features/auth/services/admin.service";

const PAGE_SIZE = 20;

export function useAdminUsers({ page = 0, search = "", role = "" } = {}) {
  return useQuery({
    queryKey: ["admin", "users", page, search, role],
    queryFn: async () => {
      return await AdminService.getUsers({
        page,
        search,
        role,
        pageSize: PAGE_SIZE,
      });
    },
  });
}

export function useAdminChannels({ page = 0, search = "" } = {}) {
  return useQuery({
    queryKey: ["admin", "channels", page, search],
    queryFn: async () => {
      return await AdminService.getChannels({
        page,
        search,
        pageSize: PAGE_SIZE,
      });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }) => {
      return await AdminService.updateUserRole(userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      return await AdminService.deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
