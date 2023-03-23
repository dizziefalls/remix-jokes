import type { ActionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { useActionData } from "@remix-run/react"

import { db } from "~/utils/db.server"
import { badRequest } from "~/utils/request.server"
import { requireUserId } from "~/utils/session.server"

function validateJokeContent(content: string) {
  if (content.length < 10) {
    return 'Come on, you gotta have a longer joke than that'
  }
}

function validateJokeName(name: string) {
  if (name.length < 3) {
    return "Need a longer joke name than that bud"
  }
}

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request)
  const form = await request.formData()
  const name = form.get("name")
  const content = form.get("content")

  if (
    typeof name !== "string" ||
    typeof content !== "string"
  ) {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: 'Form not submitted correctly'
    })
  }

  const fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content)
  }

  const fields = { name, content }
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      fields,
      formError: null
    })
  }

  const joke = await db.joke.create({ 
    data: { ...fields, jokesterId: userId } 
  })
  return redirect(`/jokes/${joke.id}`)
}

export default function NewJokeRoute() {
  const actionData = useActionData<typeof action>()

  return (
    <div>
      <p>Add your own groaner</p>
      <form method="post">
        <div>
          <label htmlFor="name">
            Name:{" "} 
            <input 
            type="text" 
            defaultValue={actionData?.fields?.name}
            name="name"
            aria-invalid={
              Boolean(actionData?.fieldErrors?.name) ||
              undefined
            }
            aria-errormessage={
              actionData?.fieldErrors?.name
                ? "name-error"
                : undefined
            }
            />
          </label>
          {actionData?.fieldErrors?.name ? (
            <p
            className="form-validation-error"
            role="alert"
            id="name-error"
            >
              {actionData.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="content">
            Content:{" "} 
            <textarea 
            name="content"
            aria-invalid={
              Boolean(actionData?.fieldErrors?.content) ||
              undefined
            }
            aria-errormessage={
              actionData?.fieldErrors?.content
                ? "content-error"
                : undefined
            }
            />
          </label>
          {actionData?.fieldErrors?.content ? (
            <p
            className="form-validation-error"
            role="alert"
            id="content-error"
            >
              {actionData.fieldErrors.content}
            </p>
          ): null}
        </div>
        <div>
          {actionData?.formError ? (
            <p
            className="form-validation-error"
            role="alert"
            >
              {actionData.formError}
            </p>
          ): null}
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </form>
    </div>
  )
}

export function ErrorBoundary() {
  return (
    <div className="error-container">
      Something unexpected happened. I just can't get it right.
    </div>
  )
}