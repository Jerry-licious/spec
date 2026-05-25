import * as z from "zod";
import {getCompiler} from "./index";
import {action, query} from "@solidjs/router";
import {CommentData} from "./db/comment";
import {FormError} from "@modular-forms/solid";
import {fromTagString} from "./tag";
import {getDataSource} from "./db/db";
import {englishDataset, englishRecommendedTransformers, RegExpMatcher, TextCensor} from 'obscenity'
import {getRequestEvent} from "solid-js/web";

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
    const compiler = await getCompiler({ loadExistingUnits: true, conservative: true }, false, true);

    return await compiler.compileText(raw);
}


function censorString(raw: string) {
    const matches = matcher.getAllMatches(raw, true);

    return censor.applyTo(raw, matches);
}


export const compileCommentQuery = query(async (raw: string) => {
    'use server';

    return await compileComment(censorString(raw));
}, 'compileComment');


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
});


function isLocalHost(): boolean {
    "use server";

    const event = getRequestEvent();
    const host = event?.request.headers.get("host") ?? "";

    return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}


export const isLocalhostQuery = query(async () => {
    "use server";

    return isLocalHost();
}, "isLocalhost");


export const deleteCommentAction = action(async (id: number) => {
    "use server";

    if (!isLocalHost()) return;

    const dataSource = await getDataSource();
    const commentRepository = dataSource.getRepository(CommentData);
    try {
        await commentRepository.delete({id})
    } catch (e) {}
})


export const getComment = query(async (id: number) => {
    'use server';

    const dataSource = await getDataSource();
    const comment = await dataSource.getRepository(CommentData)
        .findOne({
            where: { id },
            relations: { unit: true }
        });

    if (!comment) throw new Error('Unit not found.');

    // Strip non-serialisable data.
    return {
        ...comment,
        unit: {...comment.unit}
    };
}, 'comment');


export const getAllComments = query(async () => {
    'use server';

    const dataSource = await getDataSource();
    const comments = await dataSource.getRepository(CommentData).find({
        order: { posted: "DESC" }
    });

    // Strip non-serialisable data.
    return comments.map((comment) => ({...comment}));
}, 'getAllComments')

