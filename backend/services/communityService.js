const supabase = require("../supabaseClient");

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function studentMajorName(user) {
  return String(user?.major_name || user?.major || "").trim();
}

function slugifyLabel(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function departmentSlugFromMajor(majorName) {
  const base = slugifyLabel(majorName);
  return base ? `department-${base}` : "";
}

function nationalityAliases(value) {
  const key = normalize(value);
  const aliases = new Set([key]);
  if (key === "chinese" || key === "china" || key === "prc") {
    aliases.add("china");
    aliases.add("chinese");
  }
  if (key === "myanmar" || key === "burma") {
    aliases.add("myanmar");
    aliases.add("burma");
  }
  if (key === "vietnamese" || key === "vietnam") {
    aliases.add("vietnam");
    aliases.add("vietnamese");
  }
  if (key === "mongolian" || key === "mongolia") {
    aliases.add("mongolia");
    aliases.add("mongolian");
  }
  return [...aliases].filter(Boolean);
}

function extractHashtags(content) {
  const matches = String(content || "").match(/#[\w가-힣]+/g) || [];
  return [...new Set(matches)];
}

function mapGroupRow(row) {
  return {
    id: row.slug || String(row.group_id),
    group_id: row.group_id,
    slug: row.slug,
    scope: row.scope,
    name: row.name,
    icon: row.icon,
    match_key: row.match_key,
  };
}

async function findGroupByScopeAndUser(scope, user) {
  if (scope === "all") {
    const { data, error } = await supabase
      .from("community_group")
      .select("*")
      .eq("scope", "all")
      .eq("is_active", true)
      .order("group_id", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  if (scope === "department") {
    const majorName = studentMajorName(user);
    const slug = departmentSlugFromMajor(majorName);
    if (!slug) return null;

    const { data, error: groupError } = await supabase
      .from("community_group")
      .select("*")
      .eq("scope", "department")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (groupError) throw groupError;
    return data;
  }

  const { data: groups, error } = await supabase
    .from("community_group")
    .select("*")
    .eq("scope", scope)
    .eq("is_active", true);
  if (error) throw error;

  const userValue = normalize(user?.nationality);
  if (!userValue) return null;

  const aliases = nationalityAliases(userValue);

  const match = (groups || []).find((group) => {
    const key = normalize(group.match_key);
    if (!key) return false;
    return aliases.some(
      (alias) => alias === key || alias.includes(key) || key.includes(alias),
    );
  });

  return match || null;
}

async function ensureUserGroup(scope, user) {
  const existing = await findGroupByScopeAndUser(scope, user);
  if (existing) return existing;
  if (scope === "all") return null;

  const raw =
    scope === "country"
      ? String(user?.nationality || "").trim()
      : studentMajorName(user);
  if (!raw) return null;

  const slug =
    scope === "department"
      ? departmentSlugFromMajor(raw)
      : `${scope}-${slugifyLabel(raw) || "community"}`;
  if (!slug) return null;
  const name = scope === "country" ? `${raw} Community` : raw;
  const icon = scope === "country" ? "🌐" : "🎓";

  const payload = {
    slug,
    scope,
    name,
    icon,
    match_key: raw,
    banner_title: name,
    banner_body:
      scope === "country"
        ? `Connect with students from ${raw} and share campus life tips.`
        : `Ask questions, find teammates, and share tips in ${raw}.`,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("community_group")
    .upsert(payload, { onConflict: "slug" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function getMyCommunityGroup(scope, user) {
  const group = await ensureUserGroup(scope, user);
  if (!group) return null;
  return mapGroupRow(group);
}

async function listCommunityPosts({ scope, groupId, groupSlug }) {
  let query = supabase
    .from("community_post")
    .select(
      `
      *,
      student (
        student_id,
        name,
        nationality,
        major:major_id ( major_name )
      ),
      community_group (
        group_id,
        slug,
        name
      )
    `,
    )
    .eq("reported", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (groupId || groupSlug) {
    let resolvedId = groupId ? Number(groupId) : null;
    if (!resolvedId && groupSlug) {
      const { data: group } = await supabase
        .from("community_group")
        .select("group_id")
        .eq("slug", groupSlug)
        .maybeSingle();
      resolvedId = group?.group_id ?? null;
    }
    if (resolvedId) {
      query = query.eq("group_id", resolvedId);
    } else {
      query = query.eq("scope", scope || "all");
    }
  } else if (scope && scope !== "all") {
    query = query.eq("scope", scope);
  } else {
    query = query.eq("scope", "all");
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row) => ({
    id: String(row.post_id),
    group_id: row.group_id,
    group_slug: row.community_group?.slug || null,
    scope: row.scope,
    content: row.content,
    hashtags: Array.isArray(row.hashtags) ? row.hashtags : [],
    likes: row.likes_count || 0,
    comments: row.comments_count || 0,
    created_at: row.created_at,
    author_name: row.student?.name || "Student",
    author_nationality: row.student?.nationality || "International",
    author_major: row.student?.major?.major_name || "Student",
    author_student_id: String(row.student_id),
    event_date:
      row.event_month && row.event_day
        ? {
            month: row.event_month,
            day: row.event_day,
            weekday: row.event_weekday || "",
          }
        : null,
  }));
}

async function createCommunityPost({ studentId, scope, groupId, groupSlug, content }) {
  const text = String(content || "").trim();
  if (text.length < 3) {
    const err = new Error("Post content is too short");
    err.status = 400;
    throw err;
  }

  let resolvedGroupId = groupId ? Number(groupId) : null;
  if (!resolvedGroupId && groupSlug) {
    const { data: group } = await supabase
      .from("community_group")
      .select("group_id, scope")
      .eq("slug", groupSlug)
      .maybeSingle();
    resolvedGroupId = group?.group_id ?? null;
    if (group?.scope) scope = group.scope;
  }

  if (!resolvedGroupId && scope === "all") {
    const { data: allGroup } = await supabase
      .from("community_group")
      .select("group_id")
      .eq("slug", "all-intl")
      .maybeSingle();
    resolvedGroupId = allGroup?.group_id ?? null;
  }

  if (!resolvedGroupId && (scope === "department" || scope === "country")) {
    const profile = await getStudentProfileLite(studentId);
    if (profile) {
      const group = await ensureUserGroup(scope, profile);
      resolvedGroupId = group?.group_id ?? null;
    }
  }

  if (!resolvedGroupId && (scope === "department" || scope === "country")) {
    const err = new Error("Could not resolve community group for this post");
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from("community_post")
    .insert({
      group_id: resolvedGroupId,
      scope: scope || "all",
      student_id: Number(studentId),
      content: text,
      hashtags: extractHashtags(text),
    })
    .select(
      `
      *,
      student (
        student_id,
        name,
        nationality,
        major:major_id ( major_name )
      ),
      community_group ( slug )
    `,
    )
    .single();

  if (error) throw error;

  return {
    id: String(data.post_id),
    group_id: data.group_id,
    group_slug: data.community_group?.slug || null,
    scope: data.scope,
    content: data.content,
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    likes: data.likes_count || 0,
    comments: data.comments_count || 0,
    created_at: data.created_at,
    author_name: data.student?.name || "Student",
    author_nationality: data.student?.nationality || "International",
    author_major: data.student?.major?.major_name || "Student",
    author_student_id: String(data.student_id),
    event_date: null,
  };
}

async function likeCommunityPost(postId) {
  const { data: existing, error: fetchError } = await supabase
    .from("community_post")
    .select("post_id, likes_count")
    .eq("post_id", Number(postId))
    .single();
  if (fetchError) throw fetchError;

  const next = (existing.likes_count || 0) + 1;
  const { data, error } = await supabase
    .from("community_post")
    .update({ likes_count: next })
    .eq("post_id", Number(postId))
    .select("post_id, likes_count")
    .single();
  if (error) throw error;

  return { id: String(data.post_id), likes: data.likes_count };
}

async function deleteCommunityPost({ postId, studentId }) {
  const id = Number(postId);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error("Invalid post id");
    err.status = 400;
    throw err;
  }

  const { data: existing, error: fetchError } = await supabase
    .from("community_post")
    .select("post_id, student_id")
    .eq("post_id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (!existing) {
    const err = new Error("Post not found");
    err.status = 404;
    throw err;
  }

  if (Number(existing.student_id) !== Number(studentId)) {
    const err = new Error("You can only delete your own posts");
    err.status = 403;
    throw err;
  }

  const { error } = await supabase.from("community_post").delete().eq("post_id", id);
  if (error) throw error;

  return { id: String(id) };
}

async function getStudentProfileLite(studentId) {
  const { data, error } = await supabase
    .from("student")
    .select("student_id, name, nationality, major:major_id(major_name)")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    student_id: data.student_id,
    name: data.name,
    nationality: data.nationality,
    major_name: data.major?.major_name || "",
    major: data.major?.major_name || "",
  };
}

module.exports = {
  getMyCommunityGroup,
  listCommunityPosts,
  createCommunityPost,
  likeCommunityPost,
  deleteCommunityPost,
  getStudentProfileLite,
};
