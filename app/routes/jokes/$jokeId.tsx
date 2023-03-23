import type { LoaderArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { Link, useLoaderData, useParams } from "@remix-run/react"
import { db } from "~/utils/db.server"

export const loader = async ({ params }: LoaderArgs) => {
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId }
  })
  if (!joke) {
    throw new Error("Ain't no joke dang..")
  }
  return json({ joke })
}

export default function JokeRoute() {
  const data = useLoaderData<typeof loader>()
  return (
    <div>
      <p>Here's your joke bud:</p>
      <p>{data.joke.content}</p>
      <Link to='.'>{data.joke.name} Permalink</Link>
    </div>
  )
}

export function ErrorBoundary() {
  const { jokeId } = useParams()
  return (
    <div className="error-container">{`There was an error loading joke id: ${jokeId}. Dishonor on me`}</div>
  )
}