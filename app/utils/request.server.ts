import { json } from "@remix-run/node";

//writes a server badRequest for form validation
export const badRequest = <T>(data: T) => {
  return json<T>(data, { status: 400 })
}