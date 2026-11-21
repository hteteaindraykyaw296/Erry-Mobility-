'use strict';

// Keep older links to the activity tabs usable after the library split.
const previousActivity = {
  '#typing': 'typing.html',
  '#drawing': 'practice.html#drawing',
  '#objects': 'practice.html#objects'
};
if (Object.hasOwn(previousActivity, location.hash)) {
  location.replace(previousActivity[location.hash]);
}
