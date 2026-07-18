const supabase = require("../supabaseClient");

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
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

function mapGroupRow(row, { memberCount = 0, newPostCount = 0, joined = true } = {}) {
  return {
    id: row.slug || String(row.group_id),
    group_id: row.group_id,
    slug: row.slug,
    scope: row.scope,
    name: row.name,
    icon: row.icon,
    match_key: row.match_key,
    member_count: memberCount,
    new_post_count: newPostCount,
    joined,
    banner_title: row.banner_title,
    banner_body: row.banner_body,
  };
}

async function countMembersForGroup(group) {
  if (!group || group.scope === "all" || !group.match_key) return 0;

  if (group.scope === "country") {
    const aliases = nationalityAliases(group.match_key);
    const { data, error } = await supabase.from("student").select("student_id, nationality");
    if (error) throw error;
    return (data || []).filter((student) =>
      aliases.includes(normalize(student.nationality)),
    ).length;
  }

  const { data, error } = await supabase
    .from("student")
    .select("student_id, major:major_id(major_name)");
  if (error) throw error;

  const target = normalize(group.match_key);
  return (data || []).filter((student) => {
    const majorName = normalize(student.major?.major_name);
    return majorName === target || majorName.includes(target) || target.includes(majorName);
  }).length;
}

async function countRecentPosts(groupId) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("community_post")
    .select("post_id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("reported", false)
    .gte("created_at", since);
  if (error) throw error;
  return count || 0;
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

  const { data: groups, error } = await supabase
    .from("community_group")
    .select("*")
    .eq("scope", scope)
    .eq("is_active", true);
  if (error) throw error;

  const userValue =
    scope === "country" ? normalize(user?.nationality) : normalize(user?.major_name || user?.major);

  if (!userValue) return null;

  const aliases = scope === "country" ? nationalityAliases(userValue) : [userValue];

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
      : String(user?.major_name || user?.major || "").trim();
  if (!raw) return null;

  const slugBase = raw
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${scope}-${slugBase || "community"}`;
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

  const [memberCount, newPostCount] = await Promise.all([
    countMembersForGroup(group),
    countRecentPosts(group.group_id),
  ]);

  return mapGroupRow(group, {
    memberCount,
    newPostCount,
    joined: true,
  });
}

async function getCommunityMembers(groupRef) {
  let group = null;

  const asNumber = Number(groupRef);
  if (Number.isInteger(asNumber) && asNumber > 0) {
    const { data, error } = await supabase
      .from("community_group")
      .select("*")
      .eq("group_id", asNumber)
      .maybeSingle();
    if (error) throw error;
    group = data;
  }

  if (!group) {
    const { data, error } = await supabase
      .from("community_group")
      .select("*")
      .eq("slug", String(groupRef))
      .maybeSingle();
    if (error) throw error;
    group = data;
  }

  if (!group) return { group: null, members: [] };

  let students = [];

  if (group.scope === "country" && group.match_key) {
    const aliases = nationalityAliases(group.match_key);
    const { data, error: studentError } = await supabase
      .from("student")
      .select("student_id, name, nationality, major:major_id(major_name)")
      .order("name", { ascending: true });
    if (studentError) throw studentError;
    students = (data || []).filter((student) =>
      aliases.includes(normalize(student.nationality)),
    );
  } else if (group.scope === "department" && group.match_key) {
    const target = normalize(group.match_key);
    const { data, error: studentError } = await supabase
      .from("student")
      .select("student_id, name, nationality, major:major_id(major_name)")
      .order("name", { ascending: true });
    if (studentError) throw studentError;
    students = (data || []).filter((student) => {
      const majorName = normalize(student.major?.major_name);
      return majorName === target || majorName.includes(target) || target.includes(majorName);
    });
  } else if (group.scope === "all") {
    const { data, error: studentError } = await supabase
      .from("student")
      .select("student_id, name, nationality, major:major_id(major_name)")
      .order("name", { ascending: true })
      .limit(100);
    if (studentError) throw studentError;
    students = data || [];
  }

  const [memberCount, newPostCount] = await Promise.all([
    Promise.resolve(students.length),
    countRecentPosts(group.group_id),
  ]);

  return {
    group: mapGroupRow(group, { memberCount, newPostCount, joined: true }),
    members: students.map((student) => ({
      id: String(student.student_id),
      name: student.name,
      nationality: student.nationality,
      major: student.major?.major_name || "Student",
    })),
  };
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
  getCommunityMembers,
  listCommunityPosts,
  createCommunityPost,
  likeCommunityPost,
  getStudentProfileLite,
};
