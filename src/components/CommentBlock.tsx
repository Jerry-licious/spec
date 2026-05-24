import {CommentData} from "../db/comment";
import './CommentBlock.css'
import {deleteCommentAction} from "../comment";
import {useAction} from "@solidjs/router";


interface CommentBlockProps {
    comment: CommentData;
    allowDelete: boolean;
}

function formatDate(date: Date) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const time = date.toLocaleString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: false
    });

    let datePart;
    if (startOfDate.getTime() === startOfToday.getTime()) {
        datePart = "Today";
    } else if (startOfDate.getTime() === startOfYesterday.getTime()) {
        datePart = "Yesterday";
    } else {
        const day = date.getDate();
        const suffix = ["th","st","nd","rd"][
            day % 100 > 10 && day % 100 < 14 ? 0 : Math.min(day % 10, 4) > 3 ? 0 : day % 10
            ];
        const month = date.toLocaleString("en-US", { month: "long" });
        const year = date.getFullYear() !== now.getFullYear() ? `${date.getFullYear()} ` : "";
        datePart = `${year}${month} ${day}${suffix}`;
    }

    return `${datePart} at ${time}`;
}

export function CommentBlock(props: CommentBlockProps) {
    const comment = props.comment;

    const deleteComment = useAction(deleteCommentAction);

    return <div class={'comment-container'}>
        <div class={'comment-header'}>
            <a class={'link-primary'} href={`mailto:${comment.authorEmail}`}>
                <b>{comment.author}</b></a>
            <div style={{"flex-grow": 1}}/>
            <span class={'comment-time'}>{formatDate(comment.posted)}</span>
        </div>
        <div class={'comment-content'} innerHTML={comment.html}/>
        <div class={'comment-bottom'}>
            {
                props.allowDelete ? <a class={'delete-button'} href={'#'} onClick={(e) => {
                    e.preventDefault();

                    deleteComment(props.comment.id);
                }}>delete</a> : null
            }
            <a class={'comment-time'} href={`/c/${comment.id}`}>#{props.comment.id}</a>
        </div>
    </div>
}
