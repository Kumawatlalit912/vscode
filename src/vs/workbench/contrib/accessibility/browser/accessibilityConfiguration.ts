/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { ConfigurationScope, Extensions, IConfigurationNode, IConfigurationPropertySchema, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry';
import { Registry } from 'vs/platform/registry/common/platform';
import { RawContextKey } from 'vs/platform/contextkey/common/contextkey';
import { workbenchConfigurationNodeBase } from 'vs/workbench/common/configuration';
import { AccessibilityAlertSettingId } from 'vs/platform/audioCues/browser/audioCueService';
import { ISpeechService } from 'vs/workbench/contrib/speech/common/speechService';
import { Disposable } from 'vs/base/common/lifecycle';
import { IWorkbenchContribution } from 'vs/workbench/common/contributions';
import { Event } from 'vs/base/common/event';
import { audioCueFeatureBase } from 'vs/workbench/contrib/audioCues/browser/audioCues.contribution';

export const accessibilityHelpIsShown = new RawContextKey<boolean>('accessibilityHelpIsShown', false, true);
export const accessibleViewIsShown = new RawContextKey<boolean>('accessibleViewIsShown', false, true);
export const accessibleViewSupportsNavigation = new RawContextKey<boolean>('accessibleViewSupportsNavigation', false, true);
export const accessibleViewVerbosityEnabled = new RawContextKey<boolean>('accessibleViewVerbosityEnabled', false, true);
export const accessibleViewGoToSymbolSupported = new RawContextKey<boolean>('accessibleViewGoToSymbolSupported', false, true);
export const accessibleViewOnLastLine = new RawContextKey<boolean>('accessibleViewOnLastLine', false, true);
export const accessibleViewCurrentProviderId = new RawContextKey<string>('accessibleViewCurrentProviderId', undefined, undefined);

/**
 * Miscellaneous settings tagged with accessibility and implemented in the accessibility contrib but
 * were better to live under workbench for discoverability.
 */
export const enum AccessibilityWorkbenchSettingId {
	DimUnfocusedEnabled = 'accessibility.dimUnfocused.enabled',
	DimUnfocusedOpacity = 'accessibility.dimUnfocused.opacity',
	HideAccessibleView = 'accessibility.hideAccessibleView',
	AccessibleViewCloseOnKeyPress = 'accessibility.accessibleView.closeOnKeyPress'
}

export const enum ViewDimUnfocusedOpacityProperties {
	Default = 0.75,
	Minimum = 0.2,
	Maximum = 1
}

export const enum AccessibilityVerbositySettingId {
	Terminal = 'accessibility.verbosity.terminal',
	DiffEditor = 'accessibility.verbosity.diffEditor',
	Chat = 'accessibility.verbosity.panelChat',
	InlineChat = 'accessibility.verbosity.inlineChat',
	InlineCompletions = 'accessibility.verbosity.inlineCompletions',
	KeybindingsEditor = 'accessibility.verbosity.keybindingsEditor',
	Notebook = 'accessibility.verbosity.notebook',
	Editor = 'accessibility.verbosity.editor',
	Hover = 'accessibility.verbosity.hover',
	Notification = 'accessibility.verbosity.notification',
	EmptyEditorHint = 'accessibility.verbosity.emptyEditorHint',
	Comments = 'accessibility.verbosity.comments'
}

export const enum AccessibleViewProviderId {
	Terminal = 'terminal',
	TerminalHelp = 'terminal-help',
	DiffEditor = 'diffEditor',
	Chat = 'panelChat',
	InlineChat = 'inlineChat',
	InlineCompletions = 'inlineCompletions',
	KeybindingsEditor = 'keybindingsEditor',
	Notebook = 'notebook',
	Editor = 'editor',
	Hover = 'hover',
	Notification = 'notification',
	EmptyEditorHint = 'emptyEditorHint',
	Comments = 'comments'
}

const baseVerbosityProperty: IConfigurationPropertySchema = {
	type: 'boolean',
	default: true,
	tags: ['accessibility']
};
const markdownDeprecationMessage = localize('accessibility.alert.deprecationMessage', "This setting is deprecated. Use the `signals` settings instead.");
const baseAlertProperty: IConfigurationPropertySchema = {
	type: 'boolean',
	default: true,
	tags: ['accessibility'],
	markdownDeprecationMessage
};

export const accessibilityConfigurationNodeBase = Object.freeze<IConfigurationNode>({
	id: 'accessibility',
	title: localize('accessibilityConfigurationTitle', "Accessibility"),
	type: 'object'
});


const signalFeatureBase: IConfigurationPropertySchema = {
	'type': 'object',
	'tags': ['accessibility'],
	additionalProperties: false,
	default: {
		audioCue: 'auto',
		alert: 'auto'
	}
};

export const alertFeatureBase: IConfigurationPropertySchema = {
	'type': 'string',
	'enum': ['auto', 'off'],
	'default': 'auto',
	'enumDescriptions': [
		localize('audioCues.enabled.auto', "Enable alert, will only play when in screen reader optimized mode."),
		localize('audioCues.enabled.off', "Disable alert.")
	],
	tags: ['accessibility'],
};

const configuration: IConfigurationNode = {
	...accessibilityConfigurationNodeBase,
	properties: {
		[AccessibilityVerbositySettingId.Terminal]: {
			description: localize('verbosity.terminal.description', 'Provide information about how to access the terminal accessibility help menu when the terminal is focused.'),
			...baseVerbosityProperty
		},
		[AccessibilityVerbositySettingId.DiffEditor]: {
			description: localize('verbosity.diffEditor.description', 'Provide information about how to navigate changes in the diff editor when it is focused.'),
			...baseVerbosityProperty
		},
		[AccessibilityVerbositySettingId.Chat]: {
			description: localize('verbosity.chat.description', 'Provide information about how to access the chat help menu when the chat input is focused.'),
			...baseVerbosityProperty
		},
		[AccessibilityVerbositySettingId.InlineChat]: {
			description: localize('verbosity.interactiveEditor.description', 'Provide information about how to access the inline editor chat accessibility help menu and alert with hints that describe how to use the feature when the input is focused.'),
			...baseVerbosityProperty
		},
		[AccessibilityVerbositySettingId.InlineCompletions]: {
			description: localize('verbosity.inlineCompletions.description', 'Provide information about how to access the inline completions hover and Accessible View.'),
			...baseVerbosityProperty
		},
		[AccessibilityVerbositySettingId.KeybindingsEditor]: {
			description: localize('verbosity.keybindingsEditor.description', 'Provide information about how to change a keybinding in the keybindings editor when a row is focused.'),
			...baseVerbosityProperty
		},
		[AccessibilityVerbositySettingId.Notebook]: {
			description: localize('verbosity.notebook', 'Provide information about how to focus the cell container or inner editor when a notebook cell is focused.'),
			...baseVerbosityProperty
		},
		[AccessibilityVerbositySettingId.Hover]: {
			description: localize('verbosity.hover', 'Provide information about how to open the hover in an Accessible View.'),
			...baseVerbosityProperty
		},
		[AccessibilityVerbositySettingId.Notification]: {
			description: localize('verbosity.notification', 'Provide information about how to open the notification in an Accessible View.'),
			...baseVerbosityProperty
		},
		[AccessibilityVerbositySettingId.EmptyEditorHint]: {
			description: localize('verbosity.emptyEditorHint', 'Provide information about relevant actions in an empty text editor.'),
			...baseVerbosityProperty
		},
		[AccessibilityVerbositySettingId.Comments]: {
			description: localize('verbosity.comments', 'Provide information about actions that can be taken in the comment widget or in a file which contains comments.'),
			...baseVerbosityProperty
		},
		[AccessibilityAlertSettingId.Save]: {
			'markdownDescription': localize('alert.save', "Alerts when a file is saved. Also see {0}.", '`#audioCues.save#`'),
			'enum': ['userGesture', 'always', 'never'],
			'default': 'always',
			'enumDescriptions': [
				localize('alert.save.userGesture', "Alerts when a file is saved via user gesture."),
				localize('alert.save.always', "Alerts whenever is a file is saved, including auto save."),
				localize('alert.save.never', "Never alerts.")
			],
			tags: ['accessibility'],
			markdownDeprecationMessage
		},
		[AccessibilityAlertSettingId.Clear]: {
			'markdownDescription': localize('alert.clear', "Alerts when a feature is cleared (for example, the terminal, Debug Console, or Output channel). Also see {0}.", '`#audioCues.clear#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.Format]: {
			'markdownDescription': localize('alert.format', "Alerts when a file or notebook cell is formatted. Also see {0}.", '`#audioCues.format#`'),
			'type': 'string',
			'enum': ['userGesture', 'always', 'never'],
			'default': 'always',
			'enumDescriptions': [
				localize('alert.format.userGesture', "Alerts when a file is formatted via user gesture."),
				localize('alert.format.always', "Alerts whenever is a file is formatted, including auto save, on cell execution, and more."),
				localize('alert.format.never', "Never alerts.")
			],
			tags: ['accessibility'],
			markdownDeprecationMessage
		},
		[AccessibilityAlertSettingId.Breakpoint]: {
			'markdownDescription': localize('alert.breakpoint', "Alerts when the active line has a breakpoint. Also see {0}.", '`#audioCues.onDebugBreak#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.Error]: {
			'markdownDescription': localize('alert.error', "Alerts when the active line has an error. Also see {0}.", '`#audioCues.lineHasError#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.Warning]: {
			'markdownDescription': localize('alert.warning', "Alerts when the active line has a warning. Also see {0}.", '`#audioCues.lineHasWarning#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.FoldedArea]: {
			'markdownDescription': localize('alert.foldedArea', "Alerts when the active line has a folded area that can be unfolded. Also see {0}.", '`#audioCues.lineHasFoldedArea#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.TerminalQuickFix]: {
			'markdownDescription': localize('alert.terminalQuickFix', "Alerts when there is an available terminal quick fix. Also see {0}.", '`#audioCues.terminalQuickFix#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.TerminalBell]: {
			'markdownDescription': localize('alert.terminalBell', "Alerts when the terminal bell is activated."),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.TerminalCommandFailed]: {
			'markdownDescription': localize('alert.terminalCommandFailed', "Alerts when a terminal command fails (non-zero exit code). Also see {0}.", '`#audioCues.terminalCommandFailed#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.TaskFailed]: {
			'markdownDescription': localize('alert.taskFailed', "Alerts when a task fails (non-zero exit code). Also see {0}.", '`#audioCues.taskFailed#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.TaskCompleted]: {
			'markdownDescription': localize('alert.taskCompleted', "Alerts when a task completes successfully (zero exit code). Also see {0}.", '`#audioCues.taskCompleted#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.ChatRequestSent]: {
			'markdownDescription': localize('alert.chatRequestSent', "Alerts when a chat request is sent. Also see {0}.", '`#audioCues.chatRequestSent#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.ChatResponsePending]: {
			'markdownDescription': localize('alert.chatResponsePending', "Alerts when a chat response is pending. Also see {0}.", '`#audioCues.chatResponsePending#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.NoInlayHints]: {
			'markdownDescription': localize('alert.noInlayHints', "Alerts when there are no inlay hints. Also see {0}.", '`#audioCues.noInlayHints#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.LineHasBreakpoint]: {
			'markdownDescription': localize('alert.lineHasBreakpoint', "Alerts when on a line with a breakpoint. Also see {0}.", '`#audioCues.lineHasBreakpoint#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.NotebookCellCompleted]: {
			'markdownDescription': localize('alert.notebookCellCompleted', "Alerts when a notebook cell completes successfully. Also see {0}.", '`#audioCues.notebookCellCompleted#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.NotebookCellFailed]: {
			'markdownDescription': localize('alert.notebookCellFailed', "Alerts when a notebook cell fails. Also see {0}.", '`#audioCues.notebookCellFailed#`'),
			...baseAlertProperty
		},
		[AccessibilityAlertSettingId.OnDebugBreak]: {
			'markdownDescription': localize('alert.onDebugBreak', "Alerts when the debugger breaks. Also see {0}.", '`#audioCues.onDebugBreak#`'),
			...baseAlertProperty
		},
		[AccessibilityWorkbenchSettingId.AccessibleViewCloseOnKeyPress]: {
			markdownDescription: localize('terminal.integrated.accessibleView.closeOnKeyPress', "On keypress, close the Accessible View and focus the element from which it was invoked."),
			type: 'boolean',
			default: true
		},
		'accessibility.statusIndicators.debouncePositionChanges': {
			'description': localize('accessibility.statusIndicators.debouncePositionChanges', "Whether or not position changes should be debounced"),
			'type': 'boolean',
			'default': false,
			tags: ['accessibility']
		},
		'accessibility.statusIndicators.lineHasBreakpoint': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.lineHasBreakpoint', "Plays a signal when the active line has a breakpoint."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.lineHasBreakpoint.audioCue', "Plays an audio cue when the active line has a breakpoint."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.lineHasBreakpoint.alert', "Alerts when the active line has a breakpoint."),
					...alertFeatureBase
				},
			},
		},
		'accessibility.statusIndicators.lineHasInlineSuggestion.audioCue': {
			'description': localize('accessibility.statusIndicators.lineHasInlineSuggestion.audioCue', "Plays an audio cue when the active line has an inline suggestion."),
			...audioCueFeatureBase
		},
		'accessibility.statusIndicators.lineHasError': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.lineHasError', "Plays a signal when the active line has an error."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.lineHasError.audioCue', "Plays an audio cue when the active line has an error."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.lineHasError.alert', "Alerts when the active line has an error."),
					...alertFeatureBase
				},
			},
		},
		'accessibility.statusIndicators.lineHasFoldedArea': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.lineHasFoldedArea', "Plays a signal when the active line has a folded area that can be unfolded."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.lineHasFoldedArea.audioCue', "Plays an audio cue when the active line has a folded area that can be unfolded."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.lineHasFoldedArea.alert', "Alerts when the active line has a folded area that can be unfolded."),
					...alertFeatureBase
				},
			}
		},
		'accessibility.statusIndicators.lineHasWarning': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.lineHasWarning', "Plays a signal when the active line has a warning."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.lineHasWarning.audioCue', "Plays an audio cue when the active line has a warning."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.lineHasWarning.alert', "Alerts when the active line has a warning."),
					...alertFeatureBase
				},
			},
		},
		'accessibility.statusIndicators.onDebugBreak': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.onDebugBreak', "Plays a signal when the debugger stopped on a breakpoint."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.onDebugBreak.audioCue', "Plays an audio cue when the debugger stopped on a breakpoint."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.onDebugBreak.alert', "Alerts when the debugger stopped on a breakpoint."),
					...alertFeatureBase
				},
			}
		},
		'accessibility.statusIndicators.noInlayHints': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.noInlayHints', "Plays a signal when trying to read a line with inlay hints that has no inlay hints."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.noInlayHints.audioCue', "Plays an audio cue when trying to read a line with inlay hints that has no inlay hints."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.noInlayHints.alert', "Alerts when trying to read a line with inlay hints that has no inlay hints."),
					...alertFeatureBase
				},
			}
		},
		'accessibility.statusIndicators.taskCompleted': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.taskCompleted', "Plays a signal when a task is completed."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.taskCompleted.audioCue', "Plays an audio cue when a task is completed."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.taskCompleted.alert', "Alerts when a task is completed."),
					...alertFeatureBase
				},
			}
		},
		'accessibility.statusIndicators.taskFailed': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.taskFailed', "Plays a signal when a task fails (non-zero exit code)."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.taskFailed.audioCue', "Plays an audio cue when a task fails (non-zero exit code)."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.taskFailed.alert', "Alerts when a task fails (non-zero exit code)."),
					...alertFeatureBase
				},
			}
		},
		'accessibility.statusIndicators.terminalCommandFailed': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.terminalCommandFailed', "Plays a signal when a terminal command fails (non-zero exit code)."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.terminalCommandFailed.audioCue', "Plays an audio cue when a terminal command fails (non-zero exit code)."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.terminalCommandFailed.alert', "Alerts when a terminal command fails (non-zero exit code)."),
					...alertFeatureBase
				},
			}
		},
		'accessibility.statusIndicators.terminalQuickFix': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.terminalQuickFix', "Plays a signal when terminal Quick Fixes are available."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.terminalQuickFix.audioCue', "Plays an audio cue when terminal Quick Fixes are available."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.terminalQuickFix.alert', "Alerts when terminal Quick Fixes are available."),
					...alertFeatureBase
				},
			}
		},
		'accessibility.statusIndicators.terminalBell': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.terminalBell', "Plays a signal when the terminal bell is ringing."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.terminalBell.audioCue', "Plays an audio cue when the terminal bell is ringing."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.terminalBell.alert', "Alerts when the terminal bell is ringing."),
					...alertFeatureBase
				},
			}
		},
		'accessibility.statusIndicators.diffLineInserted.audioCue': {
			...audioCueFeatureBase,
			'description': localize('accessibility.statusIndicators.diffLineInserted.audioCue', "Plays an audio cue when the focus moves to an inserted line in Accessible Diff Viewer mode or to the next/previous change."),
		},
		'accessibility.statusIndicators.diffLineDeleted.audioCue': {
			...audioCueFeatureBase,
			'description': localize('accessibility.statusIndicators.diffLineDeleted.audioCue', "Plays an audio cue when the focus moves to a deleted line in Accessible Diff Viewer mode or to the next/previous change."),
		},
		'accessibility.statusIndicators.diffLineModified.audioCue': {
			...audioCueFeatureBase,
			'description': localize('accessibility.statusIndicators.diffLineModified.audioCue', "Plays an audio cue when the focus moves to a modified line in Accessible Diff Viewer mode or to the next/previous change."),
		},
		'accessibility.statusIndicators.notebookCellCompleted': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.notebookCellCompleted', "Plays a signal when a notebook cell execution is successfully completed."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.notebookCellCompleted.audioCue', "Plays an audio cue when a notebook cell execution is successfully completed."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.notebookCellCompleted.alert', "Alerts when a notebook cell execution is successfully completed."),
					...alertFeatureBase
				},
			}
		},
		'accessibility.statusIndicators.notebookCellFailed': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.notebookCellFailed', "Plays a signal when a notebook cell execution fails."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.notebookCellFailed.audioCue', "Plays an audio cue when a notebook cell execution fails."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.notebookCellFailed.alert', "Alerts when a notebook cell execution fails."),
					...alertFeatureBase
				},
			}
		},
		'accessibility.statusIndicators.chatRequestSent': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.chatRequestSent', "Plays a signal when a chat request is made."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.chatRequestSent.audioCue', "Plays an audio cue when a chat request is made."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.chatRequestSent.alert', "Alerts when a chat request is made."),
					...alertFeatureBase
				},
			}
		},
		'accessibility.statusIndicators.chatResponsePending': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.chatResponsePending', "Plays a signal on loop while the response is pending."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.chatResponsePending.audioCue', "Plays an audio cue on loop while the response is pending."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.chatResponsePending.alert', "Alerts on loop while the response is pending."),
					...alertFeatureBase
				},
			},
		},
		'accessibility.statusIndicators.chatResponseReceived.audioCue': {
			'description': localize('accessibility.statusIndicators.chatResponseReceived.audioCue', "Plays an audio cue on loop while the response has been received."),
			...audioCueFeatureBase
		},
		'accessibility.statusIndicators.clear': {
			...signalFeatureBase,
			'description': localize('accessibility.statusIndicators.clear', "Plays a signal when a feature is cleared (for example, the terminal, Debug Console, or Output channel). When this is disabled, an ARIA alert will announce 'Cleared'."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.clear.audioCue', "Plays an audio cue when a feature is cleared."),
					...audioCueFeatureBase
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.clear.alert', "Alerts when a feature is cleared."),
					...alertFeatureBase
				},
			},
		},
		'accessibility.statusIndicators.save': {
			'type': 'object',
			'tags': ['accessibility'],
			additionalProperties: true,
			'markdownDescription': localize('accessibility.statusIndicators.save', "Plays a signal when a file is saved."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.save.audioCue', "Plays an audio cue when a file is saved."),
					'type': 'string',
					'enum': ['userGesture', 'always', 'never'],
					'default': 'never',
					'enumDescriptions': [
						localize('accessibility.statusIndicators.save.audioCue.userGesture', "Plays the audio cue when a user explicitly saves a file."),
						localize('accessibility.statusIndicators.save.audioCue.always', "Plays the audio cue whenever a file is saved, including auto save."),
						localize('accessibility.statusIndicators.save.audioCue.never', "Never plays the audio cue.")
					],
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.save.alert', "Alerts when a file is saved."),
					'type': 'string',
					'enum': ['userGesture', 'always', 'never'],
					'default': 'never',
					'enumDescriptions': [
						localize('accessibility.statusIndicators.save.alert.userGesture', "Plays the alert when a user explicitly saves a file."),
						localize('accessibility.statusIndicators.save.alert.always', "Plays the alert whenever a file is saved, including auto save."),
						localize('accessibility.statusIndicators.save.alert.never', "Never plays the audio cue.")
					],
				},
			},
			default: {
				'audioCue': 'never',
				'alert': 'never'
			}
		},
		'accessibility.statusIndicators.format': {
			'type': 'object',
			'tags': ['accessibility'],
			additionalProperties: true,
			'markdownDescription': localize('accessibility.statusIndicators.format', "Plays a signal when a file or notebook is formatted."),
			'properties': {
				'audioCue': {
					'description': localize('accessibility.statusIndicators.format.audioCue', "Plays an audio cue when a file or notebook is formatted."),
					'type': 'string',
					'enum': ['userGesture', 'always', 'never'],
					'default': 'never',
					'enumDescriptions': [
						localize('accessibility.statusIndicators.format.userGesture', "Plays the audio cue when a user explicitly formats a file."),
						localize('accessibility.statusIndicators.format.always', "Plays the audio cue whenever a file is formatted, including if it is set to format on save, type, or, paste, or run of a cell."),
						localize('accessibility.statusIndicators.format.never', "Never plays the audio cue.")
					],
				},
				'alert': {
					'description': localize('accessibility.statusIndicators.format.alert', "Alerts when a file or notebook is formatted."),
					'type': 'string',
					'enum': ['userGesture', 'always', 'never'],
					'default': 'never',
					'enumDescriptions': [
						localize('accessibility.statusIndicators.format.alert.userGesture', "Plays the alertwhen a user explicitly formats a file."),
						localize('accessibility.statusIndicators.format.alert.always', "Plays the alert whenever a file is formatted, including if it is set to format on save, type, or, paste, or run of a cell."),
						localize('accessibility.statusIndicators.format.alert.never', "Never plays the alert.")
					],
				},
			}
		},
	}
};

export function registerAccessibilityConfiguration() {
	const registry = Registry.as<IConfigurationRegistry>(Extensions.Configuration);
	registry.registerConfiguration(configuration);

	registry.registerConfiguration({
		...workbenchConfigurationNodeBase,
		properties: {
			[AccessibilityWorkbenchSettingId.DimUnfocusedEnabled]: {
				description: localize('dimUnfocusedEnabled', 'Whether to dim unfocused editors and terminals, which makes it more clear where typed input will go to. This works with the majority of editors with the notable exceptions of those that utilize iframes like notebooks and extension webview editors.'),
				type: 'boolean',
				default: false,
				tags: ['accessibility'],
				scope: ConfigurationScope.APPLICATION,
			},
			[AccessibilityWorkbenchSettingId.DimUnfocusedOpacity]: {
				markdownDescription: localize('dimUnfocusedOpacity', 'The opacity fraction (0.2 to 1.0) to use for unfocused editors and terminals. This will only take effect when {0} is enabled.', `\`#${AccessibilityWorkbenchSettingId.DimUnfocusedEnabled}#\``),
				type: 'number',
				minimum: ViewDimUnfocusedOpacityProperties.Minimum,
				maximum: ViewDimUnfocusedOpacityProperties.Maximum,
				default: ViewDimUnfocusedOpacityProperties.Default,
				tags: ['accessibility'],
				scope: ConfigurationScope.APPLICATION,
			},
			[AccessibilityWorkbenchSettingId.HideAccessibleView]: {
				description: localize('accessibility.hideAccessibleView', "Controls whether the Accessible View is hidden."),
				type: 'boolean',
				default: false,
				tags: ['accessibility']
			}
		}
	});
}

export const enum AccessibilityVoiceSettingId {
	SpeechTimeout = 'accessibility.voice.speechTimeout'
}
export const SpeechTimeoutDefault = 1200;

export class DynamicSpeechAccessibilityConfiguration extends Disposable implements IWorkbenchContribution {

	static readonly ID = 'workbench.contrib.dynamicSpeechAccessibilityConfiguration';

	constructor(
		@ISpeechService private readonly speechService: ISpeechService
	) {
		super();

		this._register(Event.runAndSubscribe(speechService.onDidRegisterSpeechProvider, () => this.updateConfiguration()));
	}

	private updateConfiguration(): void {
		if (!this.speechService.hasSpeechProvider) {
			return; // these settings require a speech provider
		}

		const registry = Registry.as<IConfigurationRegistry>(Extensions.Configuration);
		registry.registerConfiguration({
			...accessibilityConfigurationNodeBase,
			properties: {
				[AccessibilityVoiceSettingId.SpeechTimeout]: {
					'markdownDescription': localize('voice.speechTimeout', "The duration in milliseconds that voice speech recognition remains active after you stop speaking. For example in a chat session, the transcribed text is submitted automatically after the timeout is met. Set to `0` to disable this feature."),
					'type': 'number',
					'default': SpeechTimeoutDefault,
					'minimum': 0,
					'tags': ['accessibility']
				}
			}
		});
	}
}
