import './CommentSection.css'
import {createSignal, Ref} from "solid-js";
import {createForm, reset, SubmitHandler, zodForm} from "@modular-forms/solid";
import {fromTagString, toTagString} from "../tag";
import {commentFormSchema, compileCommentQuery, isLocalhostQuery, submitCommentAction} from "../comment";
import {createAsync, useAction} from "@solidjs/router";
import {z} from "zod";
import {CommentData} from "../db/comment";
import {getConfig} from "../app-data";
import {CommentBlock} from "./CommentBlock";

interface CommentSectionProps {
    tag: number;
    comments: CommentData[]
}

type Tab = 'content' | 'preview';

export function CommentSection(props: CommentSectionProps) {
    const schema = commentFormSchema.refine(
        (data) => fromTagString(data.tag) === props.tag,
        { message: `Tag should be ${toTagString(props.tag)}.`, path: ['tag'] });
    const config = createAsync(() => getConfig());

    const local = createAsync(() => isLocalhostQuery());

    const [form, {Form, Field}] = createForm({
        validate: zodForm(schema),
        validateOn: 'input'
    });

    const [previewFired, setPreviewFired] = createSignal(false);
    const [submitFired, setSubmitFired] = createSignal(false);
    const [preview, setPreview] = createSignal("Press the \"preview\" button to render the comment. ");
    let previewRef!: Ref<HTMLDivElement>;

    const [tab, setTab] = createSignal<Tab>('content');

    const submitComment = useAction(submitCommentAction);

    async function updatePreview(raw: string) {
        if (previewFired()) return;
        setPreviewFired(true);

        setPreview("Compiling the comment...");

        setPreview(await compileCommentQuery(raw));

        setPreviewFired(false);

        queueMicrotask(() => {
            (window as any).MathJax?.startup?.promise
                ?.then(() => (window as any).MathJax.typesetPromise([previewRef]));
        });
    }

    function InfoField(props: { name: string, label: string, placeholder: string }) {
        // @ts-ignore
        return <Field name={props.name} type={'string'}>{
            (field, innerProps) => (
                <>
                    <span class={'post-comment-form-label'}>{props.label}:</span>
                    <input {...innerProps} value={field.value || ''} placeholder={props.placeholder}/>
                    <span class={'post-comment-form-error'}>{field.error}</span>
                </>
            )
        }</Field>
    }

    const handleSubmit: SubmitHandler<z.infer<typeof schema>> = async (values, event) => {
        if (submitFired()) return;
        setSubmitFired(true);

        try {
            await submitComment(values, props.tag);
        } catch (e) {
            setSubmitFired(false);
            throw e;
        }

        setSubmitFired(false);
        reset(form);
    };

    return <div class={'comment-section'}>
        {
            (!!(props.comments.length) && config()?.website.displayComments) && <div class={'comment-list'}>
                <h4>Comments</h4>
                {
                    props.comments.map((comment) =>
                        <CommentBlock comment={comment} allowDelete={!!local()}/>)
                }
            </div>
        }
        {
            config()?.website.allowComments && <div class={'post-comment'}>
                <h4>Post a Comment</h4>
                <Form onSubmit={handleSubmit} class={'post-comment-form'}>
                    <div class={'info-fields'}>
                        <InfoField name={'name'} label={'Name'} placeholder={'John Smith'}/>
                        <InfoField name={'email'} label={'Email'} placeholder={'info@example.me'}/>
                    </div>
                    <Field name={"content"} type={'string'}>{
                        (field, props) => {
                            return (<>
                                <div class={'comment-editor-container'}>
                                    <div class={'tab-bar'}>
                                        <button type={'button'} class={tab() == 'content' ? 'selected' : ''}
                                                onClick={() => setTab('content')}>Edit
                                        </button>
                                        <button type={'button'} class={tab() == 'preview' ? 'selected' : ''}
                                                onClick={() => {
                                                    setTab('preview');
                                                    updatePreview(field.value as string)
                                                }}>Preview
                                        </button>
                                    </div>
                                    <textarea {...props} class={'comment-textarea'} value={field.value || ''}
                                              style={{display: tab() == 'content' ? '' : 'none'}}
                                              placeholder={'Comment'}/>
                                    <div class={'comment-preview'} innerHTML={preview()} ref={previewRef}
                                         style={{display: tab() == 'preview' ? '' : 'none'}}/>
                                </div>
                                {field.error && <span class={'post-comment-form-error'}>{field.error}</span>}
                            </>)
                        }
                    }</Field>
                    <div>Please enter the tag of the current page ({toTagString(props.tag)}) to post the
                        comment.
                    </div>
                    <div class={'comment-actions'}>
                        <span>Tag: </span>
                        <Field name={'tag'} type={'string'}>{
                            (field, innerProps) => (
                                <>
                                    <input {...innerProps} value={field.value || ''}
                                           placeholder={toTagString(props.tag)}/>
                                    <span class={'post-comment-form-error'}
                                          style={{"flex-grow": 1}}>{field.error}</span>
                                </>
                            )
                        }</Field>
                        <button type={"submit"} class={submitFired() ? 'comment-submit-disabled' : ''}>Post</button>
                    </div>
                </Form>
            </div>
        }
    </div>
}

