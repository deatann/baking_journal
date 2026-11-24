import { redirect } from "next/navigation";

// The guest view of the recipes is the front page.
export default function RootPage() {
  redirect("/recipes");
}
