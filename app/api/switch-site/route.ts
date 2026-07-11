import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (slug) {
    const cookieStore = await cookies();
    cookieStore.set('testSiteSlug', slug, { path: '/' });
  }

  // Redirect to the homepage after setting the cookie
  return NextResponse.redirect(new URL('/', request.url));
}
