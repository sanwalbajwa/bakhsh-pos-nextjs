import { getAuthenticatedUser, getUserRole, supabaseAdmin } from '@/lib/serverAuth'

async function ensureAdmin(request) {
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
        return { user: null, error: 'Unauthorized', status: 401 }
    }

    const { role, error: roleError } = await getUserRole(user.id)
    if (roleError) {
        return { user: null, error: 'Unable to resolve user role', status: 500 }
    }

    if (role !== 'admin') {
        return { user: null, error: 'Forbidden – admin access required', status: 403 }
    }

    return { user, error: null, status: 200 }
}

// DELETE – remove a user (auth + profile)
export async function DELETE(request, { params }) {
    try {
        const auth = await ensureAdmin(request)
        if (auth.error) {
            return Response.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const userId = params?.id
        if (!userId) {
            return Response.json({ success: false, error: 'Missing user id' }, { status: 400 })
        }

        // Prevent self-deletion
        if (userId === auth.user.id) {
            return Response.json({ success: false, error: 'You cannot delete your own account.' }, { status: 400 })
        }

        // 1. Delete profile row first
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profileError) {
            return Response.json({ success: false, error: profileError.message }, { status: 500 })
        }

        // 2. Delete auth user
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) {
            return Response.json({ success: false, error: authError.message }, { status: 500 })
        }

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}