import z from "zod";

const TeamSchema = z.object({
    id: z.string().uuid(),
    journey_id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

const OrganizationSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
}).nullable();

const ProfileSchema = z.object({
    id: z.string().uuid(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    profile_image: z.string().nullable(),
    organizations: OrganizationSchema,
});

const TeamMemberSchema = z.object({
    id: z.string().uuid(),
    team_id: z.string().uuid(),
    user_id: z.string().uuid(),
    is_leader: z.boolean().nullable(),
    joined_at: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    profiles: z.object({
        id: z.string().uuid(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
    }).optional(),
});

const TeamPostSchema = z.object({
    id: z.string().uuid(),
    team_id: z.string().uuid().nullable(),
    is_team_submission: z.boolean().nullable(),
    content: z.string().nullable(),
    title: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    user_id: z.string().uuid(),
    mission_instance_id: z.string().uuid().nullable(),
    score: z.number().nullable(),
    view_count: z.number(),
    is_hidden: z.boolean(),
    profiles: z.object({
        id: z.string().uuid(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        profile_image: z.string().nullable(),
        organizations: z.object({
            id: z.string().uuid(),
            name: z.string(),
        }).nullable(),
    }),
    mission_id: z.string().uuid().nullable().optional(),
    journey_id: z.string().uuid().nullable().optional(),
    team_points: z.number().nullable().optional(),
    achieved: z.boolean().nullable().optional(),
    points: z.number().nullable().optional(),
});

const TeamPointsSchema = z.object({
    id: z.string().uuid(),
    team_id: z.string().uuid(),
    mission_instance_id: z.string().uuid(),
    post_id: z.string().uuid().nullable(),
    total_points: z.number().nullable().default(0),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

const TeamDataSchema = z.object({
    team: TeamSchema.nullable(),
    members: z.array(TeamMemberSchema),
});

const AllTeamDataSchema = z.object({
    teams: z.array(TeamSchema),
    teamMembers: z.record(z.string(), z.array(TeamMemberSchema)),
});

const TeamWithPointsSchema = TeamSchema.extend({
    team_points: z.array(TeamPointsSchema).optional(),
});

const TeamWithMembersSchema = TeamSchema.extend({
    members: z.array(TeamMemberSchema).optional(),
});

const TeamCompleteSchema = TeamSchema.extend({
    members: z.array(TeamMemberSchema).optional(),
    team_points: z.array(TeamPointsSchema).optional(),
});

export type Team = z.infer<typeof TeamSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type TeamPost = z.infer<typeof TeamPostSchema>;
export type TeamData = z.infer<typeof TeamDataSchema>;
export type AllTeamData = z.infer<typeof AllTeamDataSchema>;
export type TeamPoints = z.infer<typeof TeamPointsSchema>;
export type TeamWithPoints = z.infer<typeof TeamWithPointsSchema>;
export type TeamWithMembers = z.infer<typeof TeamWithMembersSchema>;
export type TeamComplete = z.infer<typeof TeamCompleteSchema>;
