import { useQuery } from "@tanstack/react-query";
import {
  useListDepartments,
  type Department,
} from "@workspace/api-client-react";

function isDepartment(value: unknown): value is Department {
  if (typeof value !== "object" || value === null) return false;
  const department = value as Record<string, unknown>;
  return (
    typeof department.id === "number" &&
    typeof department.name === "string" &&
    typeof department.createdAt === "string"
  );
}

async function loadLocalDepartments(): Promise<Department[]> {
  const response = await fetch("/local-api/public/departments");
  if (!response.ok) {
    throw new Error(`Could not load local departments: ${response.status}`);
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isDepartment)) {
    throw new Error("The local departments response is invalid");
  }
  return data;
}

export function useDepartments() {
  const localQuery = useQuery({
    queryKey: ["local-api", "public", "departments"],
    queryFn: loadLocalDepartments,
    enabled: import.meta.env.DEV,
    refetchInterval: 30_000,
  });
  const apiQuery = useListDepartments({
    query: {
      queryKey: ["/api/departments"],
      enabled: !import.meta.env.DEV,
      refetchInterval: 30_000,
    },
  });

  return import.meta.env.DEV
    ? {
        data: localQuery.data,
        isLoading: localQuery.isLoading,
        isError: localQuery.isError,
      }
    : {
        data: apiQuery.data,
        isLoading: apiQuery.isLoading,
        isError: apiQuery.isError,
      };
}
