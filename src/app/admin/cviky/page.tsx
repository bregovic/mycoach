import { redirect } from "next/navigation";

// Sjednoceno do /cviky (katalog cviků + admin sporty/prvky).
export default function AdminCvikyRedirect() {
  redirect("/cviky");
}
