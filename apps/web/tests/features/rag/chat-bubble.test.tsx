import { render, screen } from "@testing-library/react";

import { ChatBubble } from "@/features/rag/components/ChatBubble";

test("does not render unsupported chat feedback", () => {
  render(<ChatBubble content="Trả lời" role="assistant" />);

  expect(screen.queryByLabelText("Câu trả lời tốt")).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText("Câu trả lời chưa tốt"),
  ).not.toBeInTheDocument();
});
