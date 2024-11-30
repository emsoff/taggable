import { Knex } from 'knex';
export interface TagResponse {
    name: string;
    tag: {
        tagId: number;
        parent: number;
    };
    tagItemId: number;
    parent: number;
    tagger: string;
    tagged: string;
    createdAt: Date;
    updatedAt: Date;
    context: {
        context: string;
        contextId: number;
    };
    tag_type: {
        tagType: string;
        tagTypeId: number;
    };
}
export interface FlatTag {
    name: string;
    tagId: number;
    parent: number;
    tagType: string;
    tagTypeId: number;
    context: string;
    contextId: number;
    tagItemId: number;
    tagger: string;
    tagged: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TagInput {
    name: string;
    parent?: number | null;
    type_id: number;
    context_id?: number;
}
export interface TagItem {
    id: number;
    name: string;
    tagged: string;
    tagger: string;
    relationship: 'relates_to' | 'is_child_of' | 'is_not_related_to' | 'is_distinct_from' | 'describes' | 'is_similar_to';
    tag_id: number;
}
export interface TagItemInput {
    tag_id: number;
    tagger: string;
    tagged: string;
}
export interface Where {
    name?: string;
    id?: number;
    parent?: number;
    type_id?: number;
    context_id?: number;
    tag_id?: number;
    tagged?: string;
    tagger?: string;
    created_at?: Date;
    updated_at?: Date;
}
export declare class Taggable {
    private db;
    constructor(dbConfig: Knex.Config);
    createTag(tagInput: TagInput): Promise<any>;
    createContext(name: string): Promise<any>;
    createType(name: string): Promise<any>;
    getAllTags(): Promise<false | any[]>;
    getAllContexts(): Promise<false | any[]>;
    getAllTagItems(): Promise<false | any[]>;
    tagItem(tag_ids: number[], tagged: string, tagger: string): Promise<false | undefined>;
    untag(tag_ids: number[], tagged: string): Promise<false | undefined>;
    getTaggedItems(where?: Where): Promise<false | any[]>;
    tag(tag: number, tagged: string, tagger: string): Promise<false | undefined>;
    setTags(tags: number[], tagged: string, tagger: string): Promise<false | undefined>;
    getTagsByresource(tagged: string): Promise<false | any[]>;
    get(table: string, where?: Where): Promise<false | any[]>;
    createTables(): Promise<void>;
}
