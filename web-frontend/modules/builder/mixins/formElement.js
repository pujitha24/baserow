import { mapActions } from 'vuex'
import element from '@baserow/modules/builder/mixins/element'
import { FormContainerElementType } from '@baserow/modules/builder/elementTypes'

let nextFormElementOwnerId = 1

export default {
  mixins: [element],
  data() {
    return {
      inputValue: null,
    }
  },
  computed: {
    resolvedDefaultValue() {
      const init = this.elementType.getInitialFormDataValue(
        this.element,
        this.applicationContext
      )
      return init
    },
    uniqueElementId() {
      return this.elementType.uniqueElementId({
        element: this.element,
        applicationContext: this.applicationContext,
      })
    },
    formElementData() {
      return this.$store.getters['formData/getElementFormEntry'](
        this.elementPage,
        this.uniqueElementId
      )
    },
    elementFormDataValue() {
      return this.formElementData?.value
    },
    formElementInvalid() {
      return this.$store.getters['formData/getElementInvalid'](
        this.elementPage,
        this.uniqueElementId
      )
    },
    displayFormDataError() {
      return (
        this.formElementTouched && this.formElementInvalid && !this.isEditMode
      )
    },
    errorMessage() {
      return this.displayFormDataError ? this.getErrorMessage() : ''
    },
    formElementTouched() {
      return this.$store.getters['formData/getElementTouched'](
        this.elementPage,
        this.uniqueElementId
      )
    },
    /**
     * Returns whether the form element is a descendant of a form container.
     * @returns {Boolean} If one or more ancestors is a form container.
     */
    isDescendantOfFormContainer() {
      return this.$store.getters['element/getAncestors'](
        this.elementPage,
        this.element
      ).some(({ type }) => type === FormContainerElementType.getType())
    },
  },
  beforeCreate() {
    // Assigned before the watchers run, as the immediate `inputValue` watcher
    // writes the entry. Identifies this instance in the form data, so that it only
    // ever removes the entry it wrote and not one re-created by another instance
    // sharing the same `uniqueElementId` (e.g. when an element is moved).
    this.formElementOwnerId = nextFormElementOwnerId++
  },
  beforeUnmount() {
    this.unsetFormData()
  },
  methods: {
    ...mapActions({
      actionSetFormData: 'formData/setFormData',
      actionRemoveFormData: 'formData/removeFormData',
    }),
    /*
     * When a form element has been modified (e.g. a user has inputted a value),
     * mark it as touched if it's not inside a form container. Call this from
     * user input events, not value watchers: defaults and resets aren't user edits.
     */
    handleFormElementChange() {
      if (!this.isDescendantOfFormContainer) {
        this.onFormElementTouch()
      }
    },
    setFormData(value) {
      return this.actionSetFormData({
        page: this.elementPage,
        uniqueElementId: this.uniqueElementId,
        payload: {
          value,
          elementId: this.element.id,
          touched: this.formElementTouched,
          ownerId: this.formElementOwnerId,
          type: this.elementType.formDataType(
            this.element,
            this.applicationContext
          ),
          isValid: this.elementType.isValid(
            this.element,
            value,
            this.applicationContext
          ),
        },
      })
    },
    unsetFormData() {
      return this.actionRemoveFormData({
        page: this.elementPage,
        uniqueElementId: this.uniqueElementId,
        ownerId: this.formElementOwnerId,
      })
    },
    /**
     * Responsible for marking this form element as being 'touched' by a
     * user. This will help influence whether to display validation errors.
     */
    onFormElementTouch() {
      this.$store.dispatch('formData/setElementTouched', {
        page: this.elementPage,
        wasTouched: true,
        uniqueElementId: this.uniqueElementId,
      })
    },
    /** Override this method to display the right error message */
    getErrorMessage() {
      return ''
    },
  },
  watch: {
    /**
     * When a form element's formData value changes.
     */
    elementFormDataValue: {
      handler(newValue) {
        this.inputValue = newValue
      },
    },
    resolvedDefaultValue: {
      handler(newValue) {
        this.inputValue = newValue
      },
      immediate: true,
    },
    inputValue: {
      handler(newValue) {
        this.setFormData(newValue)
      },
      immediate: true,
    },
  },
}
