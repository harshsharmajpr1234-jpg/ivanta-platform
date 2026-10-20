/** Structured API error mirroring the backend envelope: { success:false, code, message, fieldErrors }. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) { super(message); this.name = 'ApiError'; }
}
