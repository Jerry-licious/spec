import * as z from "zod";
import {getCompiler} from "./index";
import {action} from "@solidjs/router";
import {CommentData} from "./db/comment";
import {FormError} from "@modular-forms/solid";
import {fromTagString} from "./tag";
import {getDataSource} from "./db/db";
import {englishDataset, englishRecommendedTransformers, RegExpMatcher, TextCensor} from 'obscenity'

const censor = new TextCensor();
const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
});

export const commentFormSchema = z.object({
    name: z.string().min(2).max(50),
    email: z.string().email().min(5).max(50),
    content: z.string().min(10).max(4000),
    tag: z.string().min(1).max(10)
});

type CommentFormInput = z.infer<typeof commentFormSchema>;

async function compileComment(raw: string) {
    // TODO: Surely I don't have to pull my entire database every time I try to compile something.
    const compiler = await getCompiler({}, false, true);

    return await compiler.compileText(raw);
}


function censorString(raw: string) {
    const matches = matcher.getAllMatches(raw, true);

    return censor.applyTo(raw, matches);
}


export const compileCommentAction = action(async (raw: string) => {
    'use server';

    return await compileComment(censorString(raw));
});


export const submitCommentAction = action(async (formData: CommentFormInput, tag: number) => {
    'use server';

    // The form doesn't validate on server side, so I have to do it here again.
    const result = commentFormSchema.safeParse(formData);
    if (!result.success) {
        throw new FormError<z.infer<typeof commentFormSchema>>("Validation failed", Object.fromEntries(
            result.error.issues.map(i => [i.path.join("."), i.message])
        ));
    }

    if (fromTagString(formData.tag) !== tag) return;

    const dataSource = await getDataSource();
    const commentRepository = dataSource.getRepository(CommentData);
    const comment = commentRepository.create({
        author: censorString(formData.name), authorEmail: censorString(formData.email), raw: censorString(formData.content),
        posted: new Date(), html: await compileComment(formData.content), unit: { tag: tag }
    });

    await commentRepository.save(comment);
})


