import mongoose, { Document } from 'mongoose';
import type { AccessibleRecordModel } from '@casl/mongoose';

/**
 * SecondMeSkillProfile — what a user's Second Me is configured to DO.
 *
 * Step 2 of the Second Me build order (SECOND-ME-SPEC.md §6): the skill profile
 * is the additive data layer that sits on top of the SecondMeIdentity (Step 1).
 * It records the persona configs — student / writer / executive — that
 * differentiate one Second Me into three task-type behaviours (spec §1: "one
 * Second Me, three configs differentiated by task-type + verify-profile").
 *
 * This model is storage only. Validation lives in the service
 * (src/lib/second-me/skill-profile.ts), mirroring the Re-educator's parseRequest
 * discipline. No routing yet (that is a later step).
 *
 * Conventions match WritingProfile.ts / SecondMeIdentity.ts exactly.
 */

/** The three personas a Second Me can act as. */
export const SECOND_ME_PERSONAS = ['student', 'writer', 'executive'] as const;
export type SecondMePersona = (typeof SECOND_ME_PERSONAS)[number];

export interface ISecondMeSkillProfile extends Document {
    userId: string;
    /** Personas this Second Me is enabled for. At least one. */
    personas: SecondMePersona[];
    /** The default persona used when a job does not specify one. */
    defaultPersona: SecondMePersona;
    /** Free-text specialization hints (e.g. "molecular biology", "sci-fi"). Optional, bounded. */
    focusAreas: string[];
}

const SecondMeSkillProfileSchema = new mongoose.Schema(
    {
        // One skill profile per user (same one-per-user rule as identity).
        userId: { type: String, required: true, unique: true, index: true },
        personas: {
            type: [String],
            enum: SECOND_ME_PERSONAS,
            required: true,
            default: ['writer'],
        },
        defaultPersona: {
            type: String,
            enum: SECOND_ME_PERSONAS,
            required: true,
            default: 'writer',
        },
        focusAreas: { type: [String], default: [] },
    },
    { timestamps: true }
);

const SecondMeSkillProfile =
    (mongoose.models.SecondMeSkillProfile as AccessibleRecordModel<ISecondMeSkillProfile>) ||
    mongoose.model<ISecondMeSkillProfile, AccessibleRecordModel<ISecondMeSkillProfile>>(
        'SecondMeSkillProfile',
        SecondMeSkillProfileSchema
    );

export default SecondMeSkillProfile;
