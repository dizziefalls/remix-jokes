import type { 
  ActionArgs,
  LinksFunction 
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { 
  useSearchParams, 
  Link, 
  useActionData, 
  Form
} from "@remix-run/react";

import stylesUrl from "~/styles/login.css"
import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { createUserSession, login, register } from "~/utils/session.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl}
]

function validateUsername(username: unknown) {
  if (typeof username !== "string" || username.length < 3) {
    return 'Usernames must be at least 3 characters long'
  }
}

function validatePassword(password: unknown) {
  if (typeof password !== 'string' || password.length < 6) {
    return 'Passwords must be at least 6 characters long'
  }
}

function validateUrl(url: string) {
  let urls = ['/jokes', '/', 'https://remix.run']
  if (urls.includes(url)) {
    return url
  }
  return '/jokes'
}

export const action = async ({ request }: ActionArgs) => {
  const form = await request.formData()
  const loginType = form.get('loginType')
  const username = form.get('username')
  const password = form.get('password')
  const redirectTo = validateUrl(
    // Tried a workaround for this error and it still didn't work. Not sure how they messed this up. TSC is NOT happy with this possibly being of type File. I'll just keep it for now.
    form.get("redirectTo") || '/jokes'
  )

  if (
    typeof loginType !== 'string' ||
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    typeof redirectTo !== 'string' 
  ) {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: 'Form not submitted correctly.'
    })
  }

  const fields = { loginType, username, password }
  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password)
  }
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      fields,
      formError: null
    })
  }

  // falls through to next case. need a return or break but it messes up the form types. 
  switch (loginType) {
    case 'login': {
      const user = await login({ username, password })
      console.log({ user })
      if (!user) {
        return badRequest({
          fieldErrors: null,
          fields,
          formError: 'Username password combination is invalid'
        })
      }
      return createUserSession(user.id, redirectTo)
    }
    case 'register': {
      const userExists = await db.user.findFirst({
        where: { username }
      })
      if (userExists) {
        return badRequest({
          fieldErrors: null,
          fields,
          formError: `User with username ${username} already exists`
        })
      }
      const user = await register({ username, password })
      if(!user) {
        return badRequest({
          fieldErrors: null,
          fields,
          formError: 'Not implemented'
        })
      }
      return createUserSession(user.id, redirectTo)
    }
    default: {
      return badRequest({
      fieldErrors: null,
      fields,
      formError: 'Login type invalid'
      })
    }
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>()
  const [searchParams] = useSearchParams()

  return (
    <div className="container">
      <div className="content" data-light=''>
        <h1>Login</h1>
        <Form method="post">
          <input 
            type="hidden"
            name="redirectTo"
            value={
              searchParams.get('redirectTo') ?? undefined
            }
          />
          <fieldset>
            <legend className="sr-only">
            Login or Register?
            </legend>
            <label>
              <input 
              type="radio"
              name="loginType"
              value='login'
              defaultChecked={
                !actionData?.fields?.loginType ||
                actionData?.fields?.loginType === 'login'
              }
              />{" "}
              Login
            </label>
            <label>
              <input 
              type="radio"
              name="loginType"
              value='register'
              defaultChecked={
                actionData?.fields?.loginType === 
                'register'
              }
              />{" "}
              Register
            </label>
          </fieldset>
          <div>
            <label htmlFor="username-input">Username</label>
          <input 
          type="text"
          id="username-input"
          name="username"
          defaultValue={actionData?.fields?.username}
          aria-invalid={Boolean(
            actionData?.fieldErrors?.username
          )}
          aria-errormessage={
            actionData?.fieldErrors?.username
              ? 'username-error'
              : undefined
          }
          />
          {actionData?.fieldErrors?.username ? (
            <p
              className="form-validation-error"
              role='alert'
              id='username-error'
            >
              {actionData.fieldErrors.username}
            </p>
          ): null}
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
          <input 
          type="password"
          id="password-input"
          name="password"
          defaultValue={actionData?.fields?.password}
          aria-invalid={Boolean(
            actionData?.fieldErrors?.password
          )}
          aria-errormessage={
            actionData?.fieldErrors?.password
              ? 'password-error'
              : undefined
          }
          />
          {actionData?.fieldErrors?.password ? (
            <p
              className="form-validation-error"
              role='alert'
              id='password-error'
            >
              {actionData.fieldErrors.password}
            </p>
          ): null}
          </div>
          <div id="form-error-message">
            {actionData?.formError ? (
              <p
                className="form-validation-error"
                role='alert'
              >
                {actionData.formError}
              </p>
            ) : null}
          </div>
          <button type="submit" className="button">
            Submit
          </button>
        </Form>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to='/'>Home</Link>
          </li>
          <li>
            <Link to='/jokes'>Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  )
}