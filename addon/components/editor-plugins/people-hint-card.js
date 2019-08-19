import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/people-hint-card';
import { inject as service } from '@ember/service';

/**
* Card displaying a hint of the Date plugin
*
* @module editor-people-hint-plugin
* @class PeopleHintCard
* @extends Ember.Component
*/
export default Component.extend({
  layout,

  hintPlugin: service('rdfa-editor-people-hint-plugin'),

  /**
   * Region on which the card applies
   * @property location
   * @type [number,number]
   * @private
  */
  location: reads('info.location'),

  /**
   * Unique identifier of the event in the hints registry
   * @property hrId
   * @type Object
   * @private
  */
  hrId: reads('info.hrId'),

  /**
   * The RDFa editor instance
   * @property editor
   * @type RdfaEditor
   * @private
  */
  editor: reads('info.editor'),

  /**
   * Hints registry storing the cards
   * @property hintsRegistry
   * @type HintsRegistry
   * @private
  */
  hintsRegistry: reads('info.hintsRegistry'),

  actions: {
    insert(){
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/people-hint-card');
      const mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('editor').replaceTextWithHTML(...mappedLocation, `<b>${this.selectedPerson.firstname} ${this.selectedPerson.lastname}</b>`);
    }
  }
});
