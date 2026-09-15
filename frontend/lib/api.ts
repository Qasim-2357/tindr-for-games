const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function getHealth(): Promise<{ status: string }> {
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${apiUrl}/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json();
}
