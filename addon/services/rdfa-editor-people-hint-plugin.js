/* eslint-disable require-yield */
import { getOwner } from '@ember/application';
import Service from '@ember/service';
import EmberObject, { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';

/**
 * Service responsible for correct annotation of dates
 *
 * @module editor-people-hint-plugin
 * @class RdfaEditorPeopleHintPlugin
 * @constructor
 * @extends EmberService
 */
const RdfaEditorPeopleHintPlugin = Service.extend({
  store: service(),

  people: computed(function(){
    // TODO: Take care of pagination
    return this.store.peekAll('person').sortBy('firstname');
  }),

  async init(){
    this._super(...arguments);
    const config = getOwner(this).resolveRegistration('config:environment');
    // TODO: Take care of pagination
    await this.store.findAll('person');
  },

  /**
   * task to handle the incoming events from the editor dispatcher
   *
   * @method execute
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Array} contexts RDFa contexts of the text snippets the event applies on
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   *
   * @public
   */
  execute: task(function * (hrId, contexts, hintsRegistry, editor) {
    if (contexts.length === 0) return [];

    const hints = [];
    contexts
      .filter(this.detectRelevantContext)
      .forEach((context) => {
        hintsRegistry.removeHintsInRegion(context.region, hrId, this.get('who'));
        hints.pushObjects(this.generateHintsForContext(context));
      });
    const cards = hints.map( (hint) => this.generateCard(hrId, hintsRegistry, editor, hint));
    if(cards.length > 0){
      hintsRegistry.addHints(hrId, this.get('who'), cards);
    }
  }),

  /**
   * Given context object, tries to detect a context the plugin can work on
   *
   * @method detectRelevantContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {String} URI of context if found, else empty string.
   *
   * @private
   */
  detectRelevantContext(context){
    let lastTriple = context.context.slice(-1)[0];
    return lastTriple.predicate === 'a' && lastTriple.object === 'http://xmlns.com/foaf/0.1/Person';
  },

  /**
   * Maps location of substring back within reference location
   *
   * @method normalizeLocation
   *
   * @param {[int,int]} [start, end] Location withing string
   * @param {[int,int]} [start, end] reference location
   *
   * @return {[int,int]} [start, end] absolute location
   *
   * @private
   */
  normalizeLocation(location, reference){
    return [location[0] + reference[0], location[1] + reference[0]];
  },

  /**
   * Generates a card given a hint
   *
   * @method generateCard
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   * @param {Object} hint containing the hinted string and the location of this string
   *
   * @return {Object} The card to hint for a given template
   *
   * @private
   */
  generateCard(hrId, hintsRegistry, editor, hint){
    return EmberObject.create({
      info: {
        label: this.get('who'),
        plainValue: hint.text,
        value: hint.value,
        datatype: hint.datatype,
        location: hint.location,
        hrId, hintsRegistry, editor
      },
      location: hint.location,
      card: this.get('who')
    });
  },

  /**
   * Generates a hint, given a context
   *
   * @method generateHintsForContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {Object} [{dateString, location}]
   *
   * @private
   */
  generateHintsForContext(context){
    // TODO: This is the original generated code. It should be removed once we get confident with the code
    // const hints = [];
    // const index = context.text.toLowerCase().indexOf('hello');
    // const text = context.text.slice(index, index+5);
    // const location = this.normalizeLocation([index, index + 5], context.region);
    // hints.push({text, location});

    const triple = context.context.slice(-1)[0];
    const hints = [];
    const value = triple.object;
    const resource = triple.resource;
    const datatype = triple.datatype;
    const text = context.text || '';
    const location = context.region;
    hints.push({text, location, context, value, resource, datatype});

    return hints;
  }
});

RdfaEditorPeopleHintPlugin.reopen({
  who: 'editor-plugins/people-hint-card'
});
export default RdfaEditorPeopleHintPlugin;
