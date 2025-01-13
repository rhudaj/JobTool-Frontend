import "./emaileditor.scss"

function EmailEditor() {

    const email = [
        "Dear Hiring Manager,",
        "I hope this message finds you well. My name is [your name], and ______.  I believe my skills and experience align closely with your team's needs. I have attached my resume for your review, but I also suggest you view my website, roman-hudaj.com.",
        "I would appreciate the opportunity to connect and discuss how I could contribute to your team. Please feel free to reach out at your convenience.",
        "Best Regards,"
    ];

    return (
        <div id="email-editor">
            <textarea id="email-text"  defaultValue={email.join("\n\n")}/>
        </div>
    );
}

export default EmailEditor;
