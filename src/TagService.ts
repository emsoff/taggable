import { Knex, knex } from 'knex';


export interface TagResponse {
    name: string,
    tag: {
        tagId: number,
        parent: number
    },
    tagItemId: number,
    parent: number,
    tagger: string,
    tagged: string,
    createdAt: Date,
    updatedAt: Date,
    context: {
        context: string,
        contextId: number
    },
    tag_type: {
        tagType: string,
        tagTypeId: number
    }
}

export interface FlatTag {
    name: string,
    tagId: number,
    parent: number,
    tagType: string,
    tagTypeId: number,
    context: string,
    contextId: number,
    tagItemId: number,
    tagger: string,
    tagged: string,
    createdAt: Date,
    updatedAt: Date,
}

export interface TagInput {
    name: string,
    parent?: number | null,
    type_id: number,
    context_id?: number
}

export interface TagItem {
    id: number,
    name: string,
    tagged: string,
    tagger: string,
    relationship: 'relates_to' | 'is_child_of' | 'is_not_related_to' | 'is_distinct_from' | 'describes' | 'is_similar_to',
    tag_id: number
}

export interface TagItemInput {
    tag_id: number,
    tagger: string,
    tagged: string
}

export interface Where {
    name?: string,
    id?: number,
    parent?: number,
    type_id?: number,
    context_id?: number,
    tag_id?: number,
    tagged?: string,
    tagger?: string,
    created_at?: Date,
    updated_at?: Date
}

export class Taggable {
    private db;

    constructor(dbConfig: Knex.Config) {
        this.db = knex(dbConfig);
    }

    async createTag(tagInput: TagInput) {
        let { name, context_id, type_id, parent } = tagInput;

        if (!parent) {
            parent = null
        }

        try {
            const existing = await this.db('tags').where({ name, context_id, type_id, parent }).first();
            if (existing) return existing.id;
            
            return await this.db('tags').insert({ name, context_id, type_id, parent });

        } catch (e) {
            console.error(e)
            return false
        }
    }

    async createContext(name: string) {
        try {
            const existing = await this.db('tag_contexts').where({ name }).first();
            if (existing) return existing.id;

            return await this.db('tag_contexts').insert({ name });

        } catch (e) {
            console.error(e)
            return false
        }
    }

    async createType(name: string) {
        try {
            const existing = await this.db('tag_types').where({ name }).first();
            if (existing) return existing.id;

            return await this.db('tag_types').insert({ name });
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async getAllTags() {
        try {
            return this.get('tags')
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async getAllContexts() {
        try {

            return this.get('tag_contexts')
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async getAllTagItems() {
        try {

            return this.get('tag_items')
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async tagItem(tag_ids: number[], tagged: string, relationship: string = 'describes', tagger: string) {
        try {

            tag_ids.map(async tag_id => {
                await this.db('tag_items').insert(
                    { tag_id, tagged, tagger, relationship } as TagItemInput
                ).catch((e) => { console.log(e) });
            })
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async untag(tag_ids: number[], tagged: string) {
        try {

            await this.db('tag_items').whereIn('tag_id', tag_ids).where({ tagged }).delete()
                .catch((e) => { console.log(e) });
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async getTaggedItems(where?: Where) {
        try {

            const items = this.db('tag_items')
                .leftJoin('tags as t', 't.id', 'tag_items.tag_id')
                .leftJoin('tag_types as tt', 'tt.id', 't.type_id')
                .leftJoin('tag_contexts as tc', 'tc.id', 't.context_id')
                .select(this.db.raw(`
                t.name as name, 
                t.id as tagId,
                t.parent as parent,

                tt.name as tagType,
                tt.id as tagTypeId,

                tc.name as context,
                tc.id as contextId,
                
                tag_items.id as tagItemId,
                tag_items.tagger,
                tag_items.tagged,
                tag_items.created_at as createdAt,
                tag_items.updated_at as updatedAt`));

            if (where) {
                return items.where(where)
            }

            const tags = await items as unknown as FlatTag[];

            return tags.map(({
                name,
                tagId,
                parent,
                tagType,
                tagTypeId,
                context,
                contextId,
                tagItemId,
                tagger,
                tagged,
                createdAt,
                updatedAt,
            }) => {
                return {
                    name,
                    tag: {
                        tagId,
                        parent
                    },
                    tagItemId,
                    parent,
                    tagger,
                    tagged,
                    createdAt,
                    updatedAt,
                    context: {
                        context,
                        contextId
                    },
                    tag_type: {
                        tagType,
                        tagTypeId
                    }

                } as TagResponse
            })


        } catch (e) {
            console.error(e)
            return false
        }
    }

    async tag(tag: number, tagged: string, tagger: string) {
        try {

            await this.tagItem([tag], tagged, tagger)

        } catch (e) {
            console.error(e)
            return false
        }
    }

    async setTags(tags: number[], tagged: string, tagger: string) {
        try {

            const current = await this.getTagsByresource(tagged)
            if (!current) return false;
            const current_ids = current.map(({ tag_id }: TagItem) => tag_id)
            const toAdd = tags.filter(x => !current_ids.includes(x));
            const toRemove = current_ids.filter(x => !tags.includes(x))

            this.untag(toRemove, tagged)
            this.tagItem(toAdd, tagged, tagger)

        } catch (e) {
            console.error(e)
            return false
        }
    }

    async getTagsByresource(tagged: string) {
        try {

            return this.get('tag_items', { tagged })

        } catch (e) {
            console.error(e)
            return false
        }
    }

    async get(table: string, where?: Where) {
        try {
            const items = this.db(table)
            if (where) {
                return items.where(where)
            }
            return items
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async createTables() {
        // Tags Table
        await this.db.schema
        .dropTable('tags')
        .createTable('tags', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.integer('parent');
            table.integer('type_id').notNullable();
            table.integer('context_id').notNullable().references('id').inTable('tag_context').onDelete('CASCADE');
            table.unique(['name', 'parent', 'type_id', 'context_id'])
            table.timestamps(true, true);
        });
    
        // Tag Types Table
        await this.db.schema
        .dropTable('tag_types')
        .createTable('tag_types', (table) => {
            table.increments('id').primary();
            table.string('name').unique().notNullable();
            table.timestamps(true, true);
    
        });
    
        // Taggable Items Table
        await this.db.schema
        .dropTable('tag_contexts')
        .createTable('tag_contexts', (table) => {
            table.increments('id').primary();
            table.string('name').unique().notNullable(); // Item type (e.g., 'post', 'product')
            table.timestamps(true, true);
    
        });
    
        // Junction Table for Tags and Items
        await this.db.schema
        .dropTable('tag_items')
        .createTableIfNotExists('tag_items', (table) => {
            table.increments('id').primary();
            table.integer('tag_id').references('id').inTable('tags').onDelete('CASCADE');
            table.integer('tagged').notNullable()
            table.integer('tagger')
            table.unique(['tag_id', 'tagged', 'tagger'])
            table.timestamps(true, true);
    
        });
    }
}
