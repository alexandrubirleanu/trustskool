---
title: "Skool Admin Roles & Moderation: Every Question Answered"
meta_description: "Every real question about Skool admin vs moderator roles, banning and removing members, AutoMod, spam, and blocking answered in one place — no filler, no fluff."
cluster: "Admin Roles & Moderation"
question_count: 9
---

# Skool Admin Roles & Moderation: Every Question Answered

Running a Skool community means making dozens of small governance calls: who gets keys to the classroom, who just gets banned, who simply gets removed. This page answers every common question about Skool's roles, member management, and anti-spam tools in one place, sourced from Skool's own help center and community threads rather than guesswork. A community's moderation hygiene is also one of the quieter signals behind healthy growth — the same growth data [TrustSkool](https://trustskool.com)'s TrustSkore tracks across 8,150+ communities in 48 languages.

## What are the member roles in Skool, and what's the actual difference between Admin and Moderator privileges?

Skool has five effective access levels: **Member**, **Moderator**, **Admin**, **Billing Manager**, and **Group Owner**. The Owner has unrestricted access (including deleting the group itself) and is excluded from the leaderboard, along with Billing Managers and Admins. A **Billing Manager** is functionally a co-owner with access to everything, including billing — a role meant for co-founders or a finance lead. An **Admin** gets access to every setting *except* billing, which covers full course/classroom editing, calendar management, member management, and content moderation. A **Moderator** is scoped much narrower: they can approve or decline new members, remove reported posts, delete comments, and invite people, and they can run and record already-scheduled calls — but they don't get into Classroom or Calendar *settings*, so they can't build courses or schedule new events ([Skool Help Center: Member roles](https://help.skool.com/article/74-member-roles)). You can have up to 30 admins in a group, but you need the Pro plan to have more than one ([Skool Help Center: How to make a member an admin or a moderator](https://help.skool.com/article/147-how-to-make-a-member-an-admin-or-mod)).

## Can moderators see all courses, and can they edit content or schedule calls?

No editing rights either way. Course creation and editing (adding modules and lessons, reordering, publishing, setting tier/level locks) lives entirely under Classroom settings, which is locked to Admins, Billing Managers, and the Owner ([Skool Help Center: Member roles](https://help.skool.com/article/74-member-roles); [How to set permissions for a course](https://help.skool.com/article/23-how-to-set-permissions-for-a-course)). A Moderator views courses the same way a regular member does — gated by whatever level-lock or tier restriction the course has, with no backend override to bypass it. The same split applies to calls: Moderators can't open Calendar settings to schedule a new call, but once an Admin has scheduled one, a Moderator can run it and hit record. If you need someone to actually build or edit curriculum, they need Admin (or Billing Manager) access, not Moderator.

## How do you make a member an admin or moderator, and how do you invite members to a community?

**Promoting someone:** go to the **Members** tab, find their name (search if the list is long), click the **MEMBERSHIP ⚙️** button next to them (or the gear icon on their profile), and choose **Make admin** or **Make moderator** from the role menu ([Skool Help Center: How to make a member an admin or a moderator](https://help.skool.com/article/147-how-to-make-a-member-an-admin-or-mod)). Remember the caps: up to 30 admins per group, and a second admin requires the Pro plan.

**Inviting members:** in **Settings → Invite**, you get four real options — a direct email invite that grants instant, pre-approved access once they click JOIN NOW; a bulk CSV upload for large lists (Skool recommends inviting in batches of around 500 and watching the join rate before sending more); a Zapier integration that auto-invites people the moment an external trigger fires (a purchase, a form submission); and shareable invite links, which you can generate multiple versions of to track which channel — email list vs. social — is actually converting ([Skool Help Center: How do I invite members to my community?](https://help.skool.com/article/14-how-do-i-invite-members-to-my-community)).

## How do you remove or ban a member, and what's the difference between 'Ban from group' and 'Remove from group'?

Both actions start the same way: **Members** tab → find the member → **MEMBERSHIP ⚙️** (or the gear on their profile) → pick the action → confirm. The difference is what happens next. **Remove from group** simply takes them out today — they're free to request access or reapply later like any other prospective member, with no lasting mark against them ([Skool Help Center: How to remove a member](https://help.skool.com/article/141-how-to-remove-a-member)). **Ban from group** is the permanent version: it stops them from requesting access or accessing the group ever again, full stop ([Skool Help Center: How to ban a member](https://help.skool.com/article/142-how-to-ban-a-member)). Use Remove for people leaving on neutral terms (inactive, refunded, just drifted off) so the door stays open; reserve Ban for actual rule-breakers you never want reapplying.

## How do you unban a member?

Skool's help center doesn't publish a dedicated "how to unban" article, and it's a genuinely common complaint in the [Skool Community](https://www.skool.com/community/unban-a-member) that the banned-members list isn't obvious in the standard Members tab. The mechanism mirrors banning: search or filter the Members tab for the person's banned status, open their **MEMBERSHIP ⚙️** settings, and reverse the ban from there — this lifts the block on requesting access, it does not automatically re-add them to the group. If you genuinely can't locate the toggle in your current dashboard version, that's a known friction point admins have flagged; open a ticket with Skool support (help@skool.com) rather than assuming the ban is permanent by design.

## How do you fully remove churned/canceled members who can still message and comment — do you have to ban them?

You don't need to ban them, and you shouldn't — banning is for rule violations, not for lapsed billing. Two different things usually cause this: first, Skool's own cancellation flow states a paying member "will be removed from the group at the end of your billing cycle," not the instant they hit cancel ([Skool Help Center: How to cancel my membership to a community?](https://help.skool.com/article/99-how-to-cancel-my-subscription-to-a-community)) — so someone who canceled mid-cycle still has every posting and messaging right they paid for until that cycle actually ends, which is by design, not a bug. Second, if your community has a free tier and a canceled paid member downgrades into it instead of leaving entirely, they never technically exit the group — they just keep whatever access your free tier grants, indefinitely, unless someone acts on it. The correct lever in both cases is **Remove from group**, not Ban: it clears them out now while leaving the door open if they resubscribe later, which Ban would permanently close.

## Can you ban a member and delete all their posts in one click, and are posts auto-deleted when a member is banned?

Banning by itself does not auto-delete anything — a banned member's existing posts and comments stay exactly where they are unless you take a second action. That second action is built into the same ban flow: the confirmation screen includes an option to also **remove the last 7 days of posts and comments**, and checking it wipes that content in the same click as the ban itself ([Skool Help Center: How to ban a member](https://help.skool.com/article/142-how-to-ban-a-member)). Two things to know before you click it: it's a rolling 7-day window, not "everything they ever posted," so older content from a long-time member stays up and needs manual deletion; and the deletion is explicitly permanent, with no undo.

## How do you manage spam (AutoMod), report spam profiles, and filter/limit who can message you or send join requests?

**AutoMod** flags high-risk users and content for review based on behavioral signals; Skool's own guidance is to ban flagged free members immediately and to refund-and-remove flagged paid members ([Skool Help Center: How to manage spam](https://help.skool.com/article/184-how-to-manage-spam-in-your-skool-community)). Beyond AutoMod, the real levers live in **Settings → Plugins**: turn *off* "Instant membership approval" so every join request needs manual sign-off, turn *on* membership questions so you can screen bios/photos before admitting anyone, and use "Unlock chat at selected Level" (and equivalent posting locks) so brand-new accounts can't immediately DM your existing members or post — they have to earn a level first. Charging even a token fee (Skool's help center cites as little as $1/year) also filters out most bot signups, since spam accounts avoid payment forms entirely. To **report a spam profile**, go to that user's profile → three-dot menu → **Report user** → pick a reason → **Report**, which routes to Skool's platform trust-and-safety team rather than just your own admins ([Skool Help Center: How to report content or a user?](https://help.skool.com/article/159-how-to-report-a-post-or-a-comment)). There's no separate personal "who's allowed to DM me" toggle beyond the community-wide chat level-lock and the block feature below — an individual member can't privately raise their own threshold.

## How do you block a member on Skool Chat, or report content/a user?

**Blocking:** open the Skool Chat conversation with the person, click the three-dot menu, and select **Block**. This stops you from being notified of their messages going forward, and — notably — they are not told they've been blocked ([Skool Help Center: How to block a member on Skool Chat?](https://help.skool.com/article/158-how-to-block-a-member-on-skool-chat)). **Reporting content:** on any post or comment, use the three-dot menu → **Report to admins**, which flags it to your own community's mods and admins for action. **Reporting a user account:** go to their profile → three-dot menu → **Report user** → choose your reason(s) → **Report**, which escalates to Skool's own platform moderation team instead of just your community's — the right path for harassment, impersonation, or anything crossing from an in-community dispute into a platform-policy violation ([Skool Help Center: How to report content or a user?](https://help.skool.com/article/159-how-to-report-a-post-or-a-comment)).

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are the member roles in Skool, and what's the actual difference between Admin and Moderator privileges?",
      "acceptedAnswer": { "@type": "Answer", "text": "Skool has five effective access levels: Member, Moderator, Admin, Billing Manager, and Group Owner. Admins get access to every setting except billing. Moderators can approve/decline members, remove reported posts, delete comments, and invite people, and can run/record already-scheduled calls, but cannot access Classroom or Calendar settings." }
    },
    {
      "@type": "Question",
      "name": "Can moderators see all courses, and can they edit content or schedule calls?",
      "acceptedAnswer": { "@type": "Answer", "text": "Moderators view courses the same way a regular member does, gated by level or tier locks, with no editing rights. Course creation/editing and call scheduling require Classroom and Calendar settings access, which is Admin/Billing Manager/Owner only. Moderators can run and record calls an Admin has already scheduled." }
    },
    {
      "@type": "Question",
      "name": "How do you make a member an admin or moderator, and how do you invite members to a community?",
      "acceptedAnswer": { "@type": "Answer", "text": "In the Members tab, click the MEMBERSHIP settings icon next to a member and choose Make admin or Make moderator (up to 30 admins, Pro plan needed for more than one). Invite members via Settings > Invite using direct email invites, bulk CSV upload, Zapier automation, or shareable invite links." }
    },
    {
      "@type": "Question",
      "name": "How do you remove or ban a member, and what's the difference between 'Ban from group' and 'Remove from group'?",
      "acceptedAnswer": { "@type": "Answer", "text": "Both start from Members tab > MEMBERSHIP settings. Remove from group takes them out but allows rejoining/reapplying later. Ban from group permanently blocks them from ever requesting access or accessing the group again." }
    },
    {
      "@type": "Question",
      "name": "How do you unban a member?",
      "acceptedAnswer": { "@type": "Answer", "text": "There is no dedicated public help article; the process mirrors banning, via the member's MEMBERSHIP settings once you locate their banned status in the Members tab. This lifts the access block but does not automatically re-add them to the group." }
    },
    {
      "@type": "Question",
      "name": "How do you fully remove churned/canceled members who can still message and comment — do you have to ban them?",
      "acceptedAnswer": { "@type": "Answer", "text": "No, use Remove from group, not Ban. Canceled paid members keep access until the end of their billing cycle by design, and may downgrade into a free tier instead of leaving entirely if one exists. Remove clears them out while still allowing a future resubscribe." }
    },
    {
      "@type": "Question",
      "name": "Can you ban a member and delete all their posts in one click, and are posts auto-deleted when a member is banned?",
      "acceptedAnswer": { "@type": "Answer", "text": "Banning alone does not delete content. The ban confirmation screen has an option to also remove the last 7 days of posts and comments in the same click, but it only covers a rolling 7-day window and the deletion is permanent." }
    },
    {
      "@type": "Question",
      "name": "How do you manage spam (AutoMod), report spam profiles, and filter/limit who can message you or send join requests?",
      "acceptedAnswer": { "@type": "Answer", "text": "AutoMod flags high-risk users for review. Turn off instant membership approval, enable membership questions, and use level-locks on chat/posting in Settings > Plugins to filter joins and messaging. Report spam profiles via the user's profile menu > Report user." }
    },
    {
      "@type": "Question",
      "name": "How do you block a member on Skool Chat, or report content/a user?",
      "acceptedAnswer": { "@type": "Answer", "text": "In a Skool Chat conversation, use the three-dot menu > Block to stop notifications from that person without alerting them. Report a post/comment via its three-dot menu > Report to admins; report a user account via their profile > three-dot menu > Report user." }
    }
  ]
}
```

[Browse Skool communities ranked by real growth data](https://trustskool.com)
