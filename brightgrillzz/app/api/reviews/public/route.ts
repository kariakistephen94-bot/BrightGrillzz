import { NextResponse } from 'next/server'
import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin'
import { REVIEWS } from '@/lib/contact'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('limit') || '3', 10)

  let dbReviews: any[] = []
  if (isServiceRoleConfigured) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('reviews')
      .select('*')
      .eq('is_published', true)
    
    if (data) {
      dbReviews = data
    }
  }

  // Merge dummy reviews with database reviews
  const allReviews = [...REVIEWS, ...dbReviews]

  // Sort by rating descending (5 stars first, etc.)
  allReviews.sort((a, b) => b.rating - a.rating)

  // Server-side pagination calculation
  const totalItems = allReviews.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const validPage = Math.min(Math.max(1, page), totalPages || 1)
  
  const paginatedReviews = allReviews.slice((validPage - 1) * pageSize, validPage * pageSize)

  return NextResponse.json({
    data: paginatedReviews,
    meta: {
      page: validPage,
      pageSize,
      totalPages,
      totalItems
    }
  })
}
