describe('$uibPosition service', function () {
  var TargetElMock = function(width, height) {
    this.width = width;
    this.height = height;

    this.prop = function(propName) {
      if (propName === 'offsetWidth') { return width; }
      if (propName === 'offsetHeight') { return height; }
    };
  };

  var $document;
  var $uibPosition;

  beforeEach(module('ui.bootstrap.position'));

  beforeEach(inject(function(_$document_, _$uibPosition_) {
    $document = _$document_;
    $uibPosition = _$uibPosition_;
  }));

  beforeEach(function () {
    jasmine.addMatchers({
      toBePositionedAt: function(util, customEqualityTesters) {
        return {
          compare: function(actual, top, left) {
            var result = {
              pass: util.equals(actual.top, top, customEqualityTesters) &&
                      util.equals(actual.left, left, customEqualityTesters)
            };

            if (result.pass) {
              result.message = 'Expected "(' + actual.top + ', ' + actual.left + ')" not to be positioned at (' + top + ', ' + left + ')';
            } else {
              result.message = 'Expected "(' + actual.top + ', ' + actual.left + ')" to be positioned at (' + top + ', ' + left + ')';
            }

            return result;
          }
        };
      }
    });
  });

  describe('rawnode', function() {
    it('returns the raw DOM element from an angular element', function() {
      var angularEl = angular.element('<div></div>');
      var el = $uibPosition.getRawNode(angularEl);
      expect(el.nodeName).toBe('DIV');
    });

    it('returns the raw DOM element from a select element', function() {
      var angularEl = angular.element('<select><option value="value">value</option></select>');
      var el = $uibPosition.getRawNode(angularEl);
      expect(el.nodeName).toBe('SELECT');
    });
  });

  describe('offset', function() {
    it('returns getBoundingClientRect by default', function() {
      var el = angular.element('<div>Foo</div>');

      /* getBoundingClientRect values will be based on the testing Chrome window
       so that makes this tests very brittle if we don't mock */
      spyOn(el[0], 'getBoundingClientRect').and.returnValue({
        width: 100,
        height: 100,
        top: 2,
        left: 2
      });
      $document.find('body').append(el);

      var offset = $uibPosition.offset(el);

      expect(offset).toEqual({
        width: 100,
        height: 100,
        top: 2,
        left: 2
      });

      el.remove();
    });
  });

  describe('viewportOffset', function() {
    var el;

    beforeEach(function() {
      el = angular.element('<div id="outer" style="overflow: auto; width: 200px; height: 200px; padding: 25px; box-sizing: border-box;"><div id="inner" style="margin: 20px; width: 100px; height: 100px; box-sizing: border-box;"></div></div>');
      $document.find('body').append(el);
    });

    afterEach(function() {
      el.remove();
    });

    it('measures the offset', function() {
      var vpOffset = $uibPosition.viewportOffset(document.getElementById('inner'));
      expect(vpOffset).toEqual({
        top: 20,
        bottom: 30,
        left: 20,
        right: 30
      });
    });

    it('measures the offset without padding', function() {
      var outerEl = document.getElementById('outer');
      outerEl.style.paddingTop = '0px';
      outerEl.style.paddingBottom = '0px';
      outerEl.style.paddingLeft = '0px';
      outerEl.style.paddingRight = '0px';

      var vpOffset = $uibPosition.viewportOffset(document.getElementById('inner'));
      expect(vpOffset).toEqual({
        top: 20,
        bottom: 80,
        left: 20,
        right: 80
      });
    });

    it('measures the offset with borders', function() {
      var outerEl = document.getElementById('outer');
      outerEl.style.width = '220px';
      outerEl.style.height = '220px';
      outerEl.style.border = '10px solid black';

      var vpOffset = $uibPosition.viewportOffset(document.getElementById('inner'));
      expect(vpOffset).toEqual({
        top: 20,
        bottom: 30,
        left: 20,
        right: 30
      });
    });

    it('measures the offset excluding padding', function() {
      var vpOffset = $uibPosition.viewportOffset(document.getElementById('inner'), false, false);
      expect(vpOffset).toEqual({
        top: 45,
        bottom: 55,
        left: 45,
        right: 55
      });
    });

    it('measures the offset when scrolled', function() {
      var innerEl = document.getElementById('inner');
      innerEl.style.width = '300px';
      innerEl.style.height = '300px';
      var outerEl = document.getElementById('outer');
      outerEl.scrollTop = 25;
      outerEl.scrollLeft = 25;

      var vpOffset = $uibPosition.viewportOffset(document.getElementById('inner'));
      expect(vpOffset.top).toEqual(-5);
      expect(vpOffset.bottom).toBeGreaterThan(-180);
      expect(vpOffset.left).toEqual(-5);
      expect(vpOffset.right).toBeGreaterThan(-180);

      //brittle
      // expect(vpOffset).toEqual({
      //   top: -5,
      //   bottom: -162,
      //   left: -5,
      //   right: -162
      // });
    });

  });

  describe('position', function() {
    var el;

    afterEach(function() {
      el.remove();
    });

    it('gets position with document as the relative parent', function() {
      el = angular.element('<div>Foo</div>');

      spyOn(el[0], 'getBoundingClientRect').and.returnValue({
        width: 100,
        height: 100,
        top: 2,
        left: 2
      });

      $document.find('body').append(el);

      var position = $uibPosition.position(el);

      expect(position).toEqual({
        width: 100,
        height: 100,
        top: 2,
        left: 2
      });
    });

    it('gets position with an element as the relative parent', function() {
      el = angular.element('<div id="outer" style="position:relative;"><div id="inner">Foo</div></div>');

      $document.find('body').append(el);

      var outerEl = angular.element(document.getElementById('outer'));
      var innerEl = angular.element(document.getElementById('inner'));

      spyOn(outerEl[0], 'getBoundingClientRect').and.returnValue({
        width: 100,
        height: 100,
        top: 2,
        left: 2
      });
      spyOn(innerEl[0], 'getBoundingClientRect').and.returnValue({
        width: 20,
        height: 20,
        top: 5,
        left: 5
      });

      var position = $uibPosition.position(innerEl);

      expect(position).toEqual({
        width: 20,
        height: 20,
        top: 3,
        left: 3
      });
    });
  });

  describe('isScrollable', function() {
    var el;

    afterEach(function() {
      el.remove();
    });

    it('should return true if the element is scrollable', function() {
      el = angular.element('<div style="overflow: auto"></div>');
      $document.find('body').append(el);
      expect($uibPosition.isScrollable(el)).toBe(true);
    });

    it('should return false if the element is scrollable', function() {
      el = angular.element('<div></div>');
      $document.find('body').append(el);
      expect($uibPosition.isScrollable(el)).toBe(false);
    });

  });

  describe('scrollParent', function() {
    var el;

    afterEach(function() {
      el.remove();
    });

    it('gets the closest scrollable ancestor', function() {
      el = angular.element('<div id="outer" style="overflow: auto;"><div>Foo<div id="inner">Bar</div></div></div>');

      $document.find('body').css({overflow: 'auto'}).append(el);

      var outerEl = document.getElementById('outer');
      var innerEl = document.getElementById('inner');

      var scrollParent = $uibPosition.scrollParent(innerEl);
      expect(scrollParent).toEqual(outerEl);
    });

    it('gets the closest scrollable ancestor with overflow-x: scroll', function() {
      el = angular.element('<div id="outer" style="overflow-x: scroll;"><div>Foo<div id="inner">Bar</div></div></div>');

      $document.find('body').css({overflow: 'auto'}).append(el);

      var outerEl = document.getElementById('outer');
      var innerEl = document.getElementById('inner');

      var scrollParent = $uibPosition.scrollParent(innerEl);
      expect(scrollParent).toEqual(outerEl);
    });

    it('gets the closest scrollable ancestor with overflow-y: hidden', function() {
      el = angular.element('<div id="outer" style="overflow-y: hidden;"><div>Foo<div id="inner">Bar</div></div></div>');

      $document.find('body').css({overflow: 'auto'}).append(el);

      var outerEl = document.getElementById('outer');
      var innerEl = document.getElementById('inner');

      var scrollParent = $uibPosition.scrollParent(innerEl, true);
      expect(scrollParent).toEqual(outerEl);
    });

    it('gets the document element if no scrollable ancestor exists', function() {
      el = angular.element('<div id="outer"><div>Foo<div id="inner">Bar</div></div></div>');

      $document.find('body').css({overflow: ''}).append(el);

      var innerEl = document.getElementById('inner');

      var scrollParent = $uibPosition.scrollParent(innerEl);
      expect(scrollParent).toEqual($document[0].documentElement);
    });

    it('gets the closest scrollable ancestor after a positioned ancestor when positioned absolute', function() {
      el = angular.element('<div id="outer" style="overflow: auto; position: relative;"><div style="overflow: auto;">Foo<div id="inner" style="position: absolute;">Bar</div></div></div>');

      $document.find('body').css({overflow: 'auto'}).append(el);

      var outerEl = document.getElementById('outer');
      var innerEl = document.getElementById('inner');

      var scrollParent = $uibPosition.scrollParent(innerEl);
      expect(scrollParent).toEqual(outerEl);
    });
  });

  describe('positionElements', function() {
    var viewportOffset,
      position,
      offset,
      hostElem,
      targetElem,
      placement;

    beforeEach(function() {
      //mock position info normally queried from the DOM
      position = {
        width: 20,
        height: 20,
        top: 100,
        left: 100
      };

      $uibPosition.position = jasmine.createSpy('position').and.returnValue(position);

      viewportOffset = {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      };

      $uibPosition.viewportOffset = jasmine.createSpy('viewportOffset').and.returnValue(viewportOffset);

      offset = {
        width: 40,
        height: 40,
        top: 100,
        left: 100
      };

      $uibPosition.offset = jasmine.createSpy('offset').and.returnValue(offset);

      $uibPosition.positionElement = jasmine.createSpy('positionElement');

      hostElem = {};
      placement = 'some-placement';
      targetElem = new TargetElMock(10, 10);
    });

    describe('with append-to-body: false', function() {
      beforeEach(function() {
        $uibPosition.positionElements(hostElem, targetElem, placement);
      });
      it('should get position', function() {
        expect($uibPosition.position).toHaveBeenCalledWith(hostElem);
      });
      it('should not get offset', function() {
        expect($uibPosition.offset).not.toHaveBeenCalled();
      });
      it('should get viewportOffset', function() {
        expect($uibPosition.viewportOffset).toHaveBeenCalledWith(hostElem, undefined);
      });
      it ('should call positionElement', function() {
        expect($uibPosition.positionElement).toHaveBeenCalledWith(viewportOffset, position, targetElem, placement);
      });
    });

    describe('with append-to-body: true', function() {
      beforeEach(function() {
        $uibPosition.positionElements(hostElem, targetElem, placement, true);
      });
      it('should not get position', function() {
        expect($uibPosition.position).not.toHaveBeenCalled();
      });
      it('should get offset', function() {
        expect($uibPosition.offset).toHaveBeenCalledWith(hostElem);
      });
      it('should get viewportOffset', function() {
        expect($uibPosition.viewportOffset).toHaveBeenCalledWith(hostElem, true);
      });
      it ('should call positionElement', function() {
        expect($uibPosition.positionElement).toHaveBeenCalledWith(viewportOffset, offset, targetElem, placement);
      });
    });
  });

  describe('positionElementAt', function() {
    var clientCoords, targetElem, placement;
    beforeEach(function() {
      $uibPosition.positionElement = jasmine.createSpy('positionElement');

      clientCoords = { clientX: 20, clientY: 10};
      placement = 'some-placement';
      targetElem = new TargetElMock(10, 10);

      $uibPosition.positionElementAt(clientCoords, targetElem, placement);
    });
    it('should call positionElement', function() {
      expect($uibPosition.positionElement).toHaveBeenCalledWith(
        {
          top: clientCoords.clientY,
          left: clientCoords.clientX,
          right: $document[0].documentElement.clientWidth - clientCoords.clientX,
          bottom: $document[0].documentElement.clientHeight - clientCoords.clientY
        },
        { top: clientCoords.clientY, left: clientCoords.clientX, height: 0, width: 0 },
        targetElem,
        placement
      );
    });
  });

  describe('positionElement', function() {
    var hostOffset, hostPos, targetElem;
    beforeEach(function() {
      //mock offset info normally queried from the DOM
      hostPos = {
        width: 20,
        height: 20,
        top: 100,
        left: 100
      };

      hostOffset = {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      };

      targetElem = new TargetElMock(10, 10);
    });

    it('should position element on top-center by default', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'other')).toBePositionedAt(90, 105);
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'top')).toBePositionedAt(90, 105);
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'top-center')).toBePositionedAt(90, 105);
    });

    it('should position on top-left', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'top-left')).toBePositionedAt(90, 100);
    });

    it('should position on top-right', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'top-right')).toBePositionedAt(90, 110);
    });

    it('should position elements on bottom-center when "bottom" specified', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'bottom')).toBePositionedAt(120, 105);
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'bottom-center')).toBePositionedAt(120, 105);
    });

    it('should position elements on bottom-left', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'bottom-left')).toBePositionedAt(120, 100);
    });

    it('should position elements on bottom-right', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'bottom-right')).toBePositionedAt(120, 110);
    });

    it('should position elements on left-center when "left" specified', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'left')).toBePositionedAt(105, 90);
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'left-center')).toBePositionedAt(105, 90);
    });

    it('should position elements on left-top when "left-top" specified', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'left-top')).toBePositionedAt(100, 90);
    });

    it('should position elements on left-bottom when "left-bottom" specified', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'left-bottom')).toBePositionedAt(110, 90);
    });

    it('should position elements on right-center when "right" specified', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'right')).toBePositionedAt(105, 120);
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'right-center')).toBePositionedAt(105, 120);
    });

    it('should position elements on right-top when "right-top" specified', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'right-top')).toBePositionedAt(100, 120);
    });

    it('should position elements on right-bottom when "right-bottom" specified', function() {
      expect($uibPosition.positionElement(hostOffset, hostPos, targetElem, 'right-bottom')).toBePositionedAt(110, 120);
    });
  });

  describe('positionElement - smart positioning', function() {
    var hostOffset, hostPos;

    beforeEach(function() {
      el = angular.element('<div></div>');
      $document.find('body').append(el);

      hostPos = {
        width: 40,
        height: 40,
        top: 100,
        left: 100
      };

      hostOffset = {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      };
    });

    afterEach(function() {
      el.remove();
    });

    // tests primary top -> bottom
    // tests secondary left -> right
    it('should position element on bottom-right when top-left does not fit', function() {
      hostOffset.bottom = 20;
      hostOffset.left = 20;
      el.css({ width: '60px', height: '20px' });
      expect($uibPosition.positionElement(hostOffset, hostPos, el, 'auto top-left')).toBePositionedAt(140, 80);
    });

    // tests primary bottom -> top
    // tests secondary right -> left
    it('should position element on top-left when bottom-right does not fit', function() {
      hostOffset.top = 20;
      hostOffset.right = 20;
      el.css({ width: '60px', height: '20px' });
      expect($uibPosition.positionElement(hostOffset, hostPos, el, 'auto bottom-right')).toBePositionedAt(80, 100);
    });

    // tests primary left -> right
    // tests secondary top -> bottom
    it('should position element on right-bottom when left-top does not fit', function() {
      hostOffset.top = 20;
      hostOffset.right = 20;
      el.css({ width: '20px', height: '60px' });
      expect($uibPosition.positionElement(hostOffset, hostPos, el, 'auto left-top')).toBePositionedAt(80, 140);
    });

    // tests primary right -> left
    // tests secondary bottom -> top
    it('should position element on left-top when right-bottom does not fit', function() {
      hostOffset.bottom = 20;
      hostOffset.left = 20;
      el.css({ width: '20px', height: '60px' });
      expect($uibPosition.positionElement(hostOffset, hostPos, el, 'auto right-bottom')).toBePositionedAt(100, 80);
    });

    // tests vertical center -> top
    it('should position element on left-top when left-center does not fit vetically', function() {
      hostOffset.bottom = 100;
      el.css({ width: '20px', height: '120px' });
      expect($uibPosition.positionElement(hostOffset, hostPos, el, 'auto left')).toBePositionedAt(100, 80);
    });

    // tests vertical center -> bottom
    it('should position element on left-bottom when left-center does not fit vertically', function() {
      hostOffset.top = 100;
      el.css({ width: '20px', height: '120px' });
      expect($uibPosition.positionElement(hostOffset, hostPos, el, 'auto left')).toBePositionedAt(20, 80);
    });

    // tests horizontal center -> left
    it('should position element on top-left when top-center does not fit horizontally', function() {
      hostOffset.right = 100;
      el.css({ width: '120px', height: '20px' });
      expect($uibPosition.positionElement(hostOffset, hostPos, el, 'auto top')).toBePositionedAt(80, 100);
    });

    // tests horizontal center -> right
    it('should position element on top-right when top-center does not fit horizontally', function() {
      hostOffset.left = 100;
      el.css({ width: '120px', height: '20px' });
      expect($uibPosition.positionElement(hostOffset, hostPos, el, 'auto top')).toBePositionedAt(80, 20);
    });
  });
});
