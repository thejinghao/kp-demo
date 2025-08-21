import { redirect } from 'next/navigation';

export default function OSMIndexRedirect() {
  redirect('/apps/osm/vertical');
}
