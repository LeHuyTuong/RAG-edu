import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import { QueryProvider } from "@/shared/providers/QueryProvider";

function QueryConsumer(): React.JSX.Element {
  const { data } = useQuery({
    queryKey: ["provider-test"],
    queryFn: async () => "available",
  });

  return <p>{data ?? "loading"}</p>;
}

test("provides one QueryClient to descendant queries", async () => {
  render(
    <QueryProvider>
      <QueryConsumer />
    </QueryProvider>,
  );

  expect(await screen.findByText("available")).toBeInTheDocument();
});
