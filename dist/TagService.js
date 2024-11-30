"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Taggable = void 0;
const knex_1 = require("knex");
class Taggable {
    constructor(dbConfig) {
        this.db = (0, knex_1.knex)(dbConfig);
    }
    createTag(tagInput) {
        return __awaiter(this, void 0, void 0, function* () {
            let { name, context_id, type_id, parent } = tagInput;
            if (!parent) {
                parent = null;
            }
            try {
                const existing = yield this.db('tags').where({ name, context_id, type_id, parent }).first();
                if (existing)
                    return existing.id;
                return yield this.db('tags').insert({ name, context_id, type_id, parent });
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    createContext(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existing = yield this.db('tag_contexts').where({ name }).first();
                if (existing)
                    return existing.id;
                return yield this.db('tag_contexts').insert({ name });
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    createType(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existing = yield this.db('tag_types').where({ name }).first();
                if (existing)
                    return existing.id;
                return yield this.db('tag_types').insert({ name });
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    getAllTags() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.get('tags');
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    getAllContexts() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.get('tag_contexts');
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    getAllTagItems() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.get('tag_items');
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    tagItem(tag_ids_1, tagged_1, tagger_1) {
        return __awaiter(this, arguments, void 0, function* (tag_ids, tagged, tagger, relationship = 'describes') {
            try {
                tag_ids.map((tag_id) => __awaiter(this, void 0, void 0, function* () {
                    yield this.db('tag_items').insert({ tag_id, tagged, tagger, relationship }).catch((e) => { console.log(e); });
                }));
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    untag(tag_ids, tagged) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.db('tag_items').whereIn('tag_id', tag_ids).where({ tagged }).delete()
                    .catch((e) => { console.log(e); });
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    getTaggedItems(where) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    return items.where(where);
                }
                const tags = yield items;
                return tags.map(({ name, tagId, parent, tagType, tagTypeId, context, contextId, tagItemId, tagger, tagged, createdAt, updatedAt, }) => {
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
                    };
                });
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    tag(tag, tagged, tagger) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.tagItem([tag], tagged, tagger);
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    setTags(tags, tagged, tagger) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const current = yield this.getTagsByresource(tagged);
                if (!current)
                    return false;
                const current_ids = current.map(({ tag_id }) => tag_id);
                const toAdd = tags.filter(x => !current_ids.includes(x));
                const toRemove = current_ids.filter(x => !tags.includes(x));
                this.untag(toRemove, tagged);
                this.tagItem(toAdd, tagged, tagger);
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    getTagsByresource(tagged) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.get('tag_items', { tagged });
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    get(table, where) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const items = this.db(table);
                if (where) {
                    return items.where(where);
                }
                return items;
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    createTables() {
        return __awaiter(this, void 0, void 0, function* () {
            // Tags Table
            yield this.db.schema
                .dropTable('tags')
                .createTable('tags', (table) => {
                table.increments('id').primary();
                table.string('name').notNullable();
                table.integer('parent');
                table.integer('type_id').notNullable();
                table.integer('context_id').notNullable().references('id').inTable('tag_context').onDelete('CASCADE');
                table.unique(['name', 'parent', 'type_id', 'context_id']);
                table.timestamps(true, true);
            });
            // Tag Types Table
            yield this.db.schema
                .dropTable('tag_types')
                .createTable('tag_types', (table) => {
                table.increments('id').primary();
                table.string('name').unique().notNullable();
                table.timestamps(true, true);
            });
            // Taggable Items Table
            yield this.db.schema
                .dropTable('tag_contexts')
                .createTable('tag_contexts', (table) => {
                table.increments('id').primary();
                table.string('name').unique().notNullable(); // Item type (e.g., 'post', 'product')
                table.timestamps(true, true);
            });
            // Junction Table for Tags and Items
            yield this.db.schema
                .dropTable('tag_items')
                .createTableIfNotExists('tag_items', (table) => {
                table.increments('id').primary();
                table.integer('tag_id').references('id').inTable('tags').onDelete('CASCADE');
                table.integer('tagged').notNullable();
                table.integer('tagger');
                table.unique(['tag_id', 'tagged', 'tagger']);
                table.timestamps(true, true);
            });
        });
    }
}
exports.Taggable = Taggable;
