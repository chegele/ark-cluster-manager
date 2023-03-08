
const component : string = "markdown-editor";
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import * as DOMPurify from 'dompurify';

interface EditorTool {
  icon?: string,
  text?: string,
  title: string,
  action: Function
}

const markdownIntroduction = `
# Markdown Editor

First time using a markdown editor? 
Check out The Markdown Guide & Cheat Sheet. 
Click on the markdown icon at the top of the editor or use the link below. 

**Markdown Cheat Sheet**
 - https://www.markdownguide.org/cheat-sheet/
`;

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
  encapsulation: ViewEncapsulation.None,
})
export class MarkdownEditorComponent implements OnInit {

  @ViewChild('code_mirror') private mirrorRef: CodemirrorComponent;
  @Input() content: string;
  @Input() validation: (content: string) => string | null
  @Input() sanitize = true;
  @Output() contentSubmitted = new EventEmitter<string>();
  protected previewMarkdown = "";
  protected errors: string[] = [];

  ngOnInit() {
    if (!this.content || this.content == "") this.content = markdownIntroduction;
    if (!this.validation) this.validation = () => null;
  }

  protected toolbar: EditorTool[] = [
    { title: "Markdown Information", icon: "markdown", action: this.informationClicked },
    //{ title: "", action: function() {}},
    { title: "Large Header", icon: "type-h1", action: this.headerOneClicked.bind(this) },
    { title: "Medium Header", icon: "type-h2", action: this.headerTwoClicked.bind(this) },
    { title: "Small Header", icon: "type-h3", action: this.headerThreeClicked.bind(this) },
    { title: "Bold Font", icon: "type-bold", action: this.styleBoldClicked.bind(this) },
    { title: "Italic Font", icon: "type-italic", action: this.styleItalicClicked.bind(this) },
    { title: "Strikethrough Font", icon: "type-strikethrough", action: this.styleStrikeClicked.bind(this) },
    { title: "Insert Image", icon: "image", action: this.insertImageClicked.bind(this) },
    { title: "Ordered List", icon: "list-ol", action: this.orderedListClicked.bind(this) },
    { title: "Unordered List", icon: "list-ul", action: this.unorderedListClicked.bind(this) },
  ]

  protected actions: EditorTool[] = [
    { title: "Update Markdown Preview", text: "Preview", action: this.updateClicked.bind(this) },
    { title: "Submit & Save Changes", text: "Submit", action: this.submitClicked.bind(this) },
  ];

  protected informationClicked() {
    window.open("https://www.markdownguide.org/basic-syntax/", "_blank");
  }

  protected headerOneClicked() {
    const currentText = this.getCurrentLine();
    if (currentText.startsWith("#")) return;
    else if (currentText.trim() == "") this.appendToLine("# TYPE_HERE");
    else this.appendToLine("# ");
  }

  protected headerTwoClicked() {
    const currentText = this.getCurrentLine();
    if (currentText.startsWith("##")) return;
    else if (currentText.trim() == "") this.appendToLine("## TYPE_HERE");
    else this.appendToLine("## ");
  }

  protected headerThreeClicked() {
    const currentText = this.getCurrentLine();
    if (currentText.startsWith("###")) return;
    else if (currentText.trim() == "") this.appendToLine("### TYPE_HERE");
    else this.appendToLine("### ");
  }

  protected styleBoldClicked() {
    this.wrapSelection("**");
  }

  protected styleItalicClicked() {
    this.wrapSelection("_");
  }

  protected styleStrikeClicked() {
    this.wrapSelection("~~");
  }

  protected orderedListClicked() {
    const currentText = this.getCurrentLine();
    if (currentText.trim().startsWith("1.")) return;
    else if (currentText.trim() == "") this.appendToLine(" 1. List Item");
    else this.appendToLine(" 1. ");
  }

  protected unorderedListClicked() {
    const currentText = this.getCurrentLine();
    if (currentText.trim().startsWith("-")) return;
    else if (currentText.trim() == "") this.appendToLine(" - List Item");
    else this.appendToLine(" - ");
  }

  protected insertImageClicked() {
    this.appendToLine(`<img class="center fit" src="COPY LINK HERE">\n`);
  }

  protected updateClicked() {
    if (!this.validateMarkdown()) return;
    this.previewMarkdown = this.content;
  }

  protected submitClicked() {
    if (!this.validateMarkdown()) return;
    this.contentSubmitted.emit(this.content);
  }

  private getCurrentLine() {
    const editor = this.mirrorRef.codeMirror;
    if (!editor) return "";
    const line = editor.getCursor().line;
    if (!line && line !== 0) return "";
    return editor.getLine(line);
  }

  private appendToLine(text: string, toEnd = false) {
    const editor = this.mirrorRef.codeMirror;
    if (!editor) return;
    const line = editor.getCursor().line;
    if (!line && line !== 0) return;
    const currentText = editor.getLine(line);
    const updatedText = toEnd ? currentText + text : text + currentText;
    editor.replaceRange(updatedText, {line, ch: 0}, {line, ch: currentText.length});
    editor.focus();
  }

  private wrapSelection(wrap: string, hintText = "text_here") {
    const editor = this.mirrorRef.codeMirror;
    if (!editor) return;
    const selection = editor.getSelection();
    if (!selection) {
      const cursor = editor.getCursor();
      editor.replaceRange(wrap + hintText + wrap, cursor);
    } else {
      const updatedSelection = wrap + selection + wrap;
      editor.replaceSelection(updatedSelection);
    }
    editor.focus();
  }

  private validateMarkdown() {
    this.errors = [];
    let valid = true;
    if (!this.validateHasContent()) valid = false;
    if (!this.validateIntroRemoved()) valid = false;
    if (!this.validateSafeContent()) valid = false;
    if (!this.inputValidation()) valid = false;
    return valid;
  }

  private validateHasContent() {
    const trimmedContent = this.content.trim();
    if (!trimmedContent || trimmedContent.length < 2) {
      this.errors.push("You can't submit empty markdown.");
      return false;
    }
    return true;
  }

  private validateIntroRemoved() {
    for (const line of markdownIntroduction.split('\n')) {
      if (line.trim() == "") continue;
      if (this.content.includes(line)) {
        this.errors.push("You must remove all of the markdown introduction text.");
        return false;
      }
    }
    return true;
  }

  private validateSafeContent() {
    if (this.sanitize) {
      const clean = DOMPurify.sanitize(this.content);
      if (this.content.length != clean.length) {
        this.content = clean;
        this.errors.push(
          "Invalid markdown has been removed from the editor. \n" + 
          "Please review the updated markdown for removal of any critical information. \n" +
          "You can undo changes using the keyboard shortcuts (ctrl + z)"
        );
        return false;
      }
    }
    return true;
  }

  private inputValidation() {
    const error = this.validation(this.content);
    if (error) {
      this.errors.push(error);
      return false;
    }
    return true;
  }

}
