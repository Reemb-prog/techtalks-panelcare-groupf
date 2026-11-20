import { appName } from "./site";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-4 py-12 sm:px-8">
      <h1 className="text-3xl font-semibold sm:text-4xl">{appName}</h1>
      <p className="text-base text-neutral-600 sm:text-lg">
        Project scaffold. Coordinator and technician screens arrive in Sprint 1.
      </p>
    </main>
  );
}
