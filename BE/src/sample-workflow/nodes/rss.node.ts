import { BaseWorkflowNode } from './workflow-node.interface';
import axios from 'axios';

export class RSSNode extends BaseWorkflowNode {
    async execute(inputs: any[], data: any): Promise<any> {
        const config = data.config || {};
        const url = config.url || this.resolveVariables(inputs[0]); // Allow input or config

        if (!url) {
            throw new Error('RSS Feed URL is required');
        }

        this.log('INFO', `Fetching RSS feed from: ${url}`);

        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
                },
                timeout: 10000
            });

            const xml = response.data;
            const items = this.parseRSS(xml);

            this.log('INFO', `Successfully fetched ${items.length} items from RSS feed`);

            return {
                items,
                count: items.length,
                feedUrl: url
            };

        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.log('ERROR', `Failed to fetch RSS feed: ${msg}`);
            throw new Error(`Running RSS Node failed: ${msg}`);
        }
    }

    private parseRSS(xml: string): any[] {
        const items: any[] = [];

        // Support both RSS <item> and Atom <entry>
        const itemRegex = /<(item|entry)>([\s\S]*?)<\/(item|entry)>/g;
        let match;

        // Simple HTML stripper for contentSnippet
        const stripHtml = (html: string) => {
            if (!html) return '';
            return html
                .replace(/<[^>]*>?/gm, '') // Remove tags
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/\s+/g, ' ') // Collapse whitespace
                .trim();
        };

        while ((match = itemRegex.exec(xml)) !== null) {
            const entryContent = match[2];
            const item: any = {};

            // Helper to extract tag content
            const extract = (tag: string) => {
                const tagRegex = new RegExp(`<${tag}.*?>([\\s\\S]*?)<\/${tag}>`, 'i');
                const tagMatch = tagRegex.exec(entryContent);
                if (tagMatch) {
                    let content = tagMatch[1].trim();
                    if (content.startsWith('<![CDATA[') && content.endsWith(']]>')) {
                        content = content.substring(9, content.length - 3);
                    }
                    return content;
                }
                return null;
            };

            // Helper to extract attributes (e.g., <link href="..." />)
            const extractAttr = (tag: string, attr: string) => {
                const attrRegex = new RegExp(`<${tag}[^>]*?${attr}=["']([^"']*)["']`, 'i');
                const attrMatch = attrRegex.exec(entryContent);
                return attrMatch ? attrMatch[1] : null;
            };

            // Deep extract for tags like <author><name>...</name></author>
            const extractSubTag = (parentTag: string, childTag: string) => {
                const parentRegex = new RegExp(`<${parentTag}.*?>([\\s\\S]*?)<\/${parentTag}>`, 'i');
                const parentMatch = parentRegex.exec(entryContent);
                if (parentMatch) {
                    const childRegex = new RegExp(`<${childTag}.*?>([\\s\\S]*?)<\/${childTag}>`, 'i');
                    const childMatch = childRegex.exec(parentMatch[1]);
                    if (childMatch) {
                        let content = childMatch[1].trim();
                        if (content.startsWith('<![CDATA[') && content.endsWith(']]>')) {
                            content = content.substring(9, content.length - 3);
                        }
                        return content;
                    }
                    return parentMatch[1].trim(); // Fallback to parent content if child not found
                }
                return null;
            };

            item.title = extract('title');
            item.link = extract('link') || extractAttr('link', 'href');
            item.author = extractSubTag('author', 'name') || extract('dc:creator');

            const rawContent = extract('content:encoded') || extract('content') || extract('description') || '';
            const rawSummary = extract('summary') || extract('description') || '';

            item.content = rawContent;
            item.summary = rawSummary;
            item.contentSnippet = stripHtml(rawSummary || rawContent).substring(0, 500);

            const rawDate = extract('pubDate') || extract('published') || extract('updated');
            item.pubDate = rawDate;

            if (rawDate) {
                try {
                    item.isoDate = new Date(rawDate).toISOString();
                } catch (e) {
                    item.isoDate = rawDate;
                }
            }

            item.id = extract('guid') || extract('id');

            items.push(item);
        }

        return items;
    }
}
