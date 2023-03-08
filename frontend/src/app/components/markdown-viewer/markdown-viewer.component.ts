
const component : string = "markdown-viewer";
import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { marked } from 'marked';

@Component({
  selector: component,
  templateUrl: `./${component}.template.html`,
  styleUrls: [ `./${component}.style.css` ],
  encapsulation: ViewEncapsulation.None
})
export class MarkdownViewerComponent implements OnChanges, OnInit {

  @Input() markdown: string;
  protected html: string;
  private markdownParser = marked.setOptions({});

  ngOnInit(): void {
    if (!this.markdown) this.markdown = "### Markdown Viewer\n No content provided.";
    this.parseMarkdown();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const markdownChange = changes["markdown"];
    if (!markdownChange) return;
    this.parseMarkdown();
  }

  private parseMarkdown() {
    try {
      this.html = this.markdownParser.parse(this.markdown);
    } catch(err) {
      this.html = '<p class="error">Error parsing markdown.</p>'
    }
  }



}
