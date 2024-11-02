import "./Message.css"


export enum MessageState {
    SUCCESS = "success",
    WARNING = "warning",
    ERROR = "error"
}


interface MessageProps {
    state: MessageState,
    children: React.ReactNode
}


export function Message(props: MessageProps) {

    return (
        <article className={`message ${
            props.state === MessageState.SUCCESS ? "success" : 
            props.state === MessageState.WARNING ? "warning" : 
            "error"
        }`}>
            { props.children }
        </article>
    )
}