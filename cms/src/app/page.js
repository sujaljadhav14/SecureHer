// app/page.js
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
  // This component won't render, as redirect() is a server function
  // that will handle the redirection before the component renders
  return null;
}